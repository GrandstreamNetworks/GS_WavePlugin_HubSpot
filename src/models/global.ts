import { CLIENT, REQUEST_CODE, SESSION_STORAGE_KEY } from '@/constant';
import { deleteToken, getAccount, getToken, getUser } from '@/services/global';
import { get } from 'lodash';
import { Effect, Reducer, history } from 'umi';

export interface GlobalModelState {
    userConfig: LooseObject
    user: LooseObject
    account: LooseObject
    connectState: string
    uploadCall: boolean
    showConfig: LooseObject
    tokenInfo: LooseObject
    callState: Map<string, boolean>
}

export interface GlobalModelType {
    namespace: string;
    state: GlobalModelState;
    effects: {
        getToken: Effect
        getUser: Effect
        getAccount: Effect
        saveUserConfig: Effect
        logout: Effect
        userConfigChange: Effect
    };
    reducers: {
        save: Reducer<GlobalModelState>;
    };
}

const GlobalModal: GlobalModelType = {
    namespace: 'global',
    state: {
        user: {},
        userConfig: {},
        account: {},
        connectState: 'SUCCESS',
        uploadCall: true,
        showConfig: {},
        tokenInfo: {},
        callState: new Map(),
    },

    effects: {
        *getToken({ payload }, { call }): any {
            const res = yield call(getToken, payload);
            if (res?.access_token) {
                sessionStorage.setItem(SESSION_STORAGE_KEY.token, res.access_token);
            }
            return res;
        },

        * getAccount(_, { call, put }): any {
            const res = yield call(getAccount)
            const connectState = res?.code || 'SUCCESS';
            yield put({
                type: 'save',
                payload: {
                    account: res,
                    connectState,
                }
            })
            return res;
        },

        *getUser({ payload }, { call, put }): any {
            let res = yield call(getUser);
            if (res.code === REQUEST_CODE.noAuthority || res.status === REQUEST_CODE.noAuthority) {
                const getToken = yield put({
                    type: 'getToken',
                    payload: {
                        grant_type: 'refresh_token',
                        client_id: CLIENT.client_id,
                        client_secret: CLIENT.client_secret,
                        redirect_uri: CLIENT.redirect_uri,
                        refresh_token: payload?.refresh_token
                    }
                })
                yield call(() => getToken);
                res = yield call(getUser);
            }
            yield put({
                type: 'getAccount',
            })
            const userInfo = get(res, ['results', 0]) || {};
            if (userInfo.email) {
                yield put({
                    type: 'save',
                    payload: {
                        user: userInfo,
                    },
                });
            }
            return userInfo;
        },

        * logout(_, { call, put, select }) {
            const { userConfig } = yield select((state: any) => state.global);
            userConfig.autoLogin = false;
            yield put({
                type: 'saveUserConfig',
                payload: userConfig
            });
            // @ts-ignore
            yield pluginSDK.clearCookie({ origin: 'https://app.hubspot.com' }, function () { });
            yield call(deleteToken, userConfig.refresh_token);
            history.replace({ pathname: "login" });
        },

        * userConfigChange({ payload }, { put, select }) {
            const { userConfig } = yield select((state: any) => state.global);
            const newConfig = {
                ...userConfig,
                ...payload,
            }
            yield put({
                type: 'saveUserConfig',
                payload: newConfig,
            })
        },

        *saveUserConfig({ payload }, { put }) {
            console.log(payload);
            // @ts-ignore
            pluginSDK.userConfig.addUserConfig({ userConfig: JSON.stringify(payload) }, function ({ errorCode }) {
                console.log(errorCode);
            });
            yield put({
                type: 'save',
                payload: {
                    userConfig: payload,
                },
            });
        },
    },

    reducers: {
        save(state, action) {
            return { ...state, ...action.payload };
        },
    },
};

export default GlobalModal;
