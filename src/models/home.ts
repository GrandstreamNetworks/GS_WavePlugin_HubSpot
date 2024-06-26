import { CLIENT, REQUEST_CODE } from '@/constant';
import { createContact, getContact, getContactById, putCallInfo, putCallToContact } from '@/services/home';
import { get } from 'lodash';
import { Effect, Reducer } from 'umi';

export interface HomeModelState {
}

export interface HomeModelType {
    namespace: string
    state: HomeModelState
    effects: {
        getContact: Effect
        putCallInfo: Effect
        createNewContact: Effect
    }
    reducers: {
        save: Reducer<HomeModelState>
    }
}

const HomeModal: HomeModelType = {
    namespace: 'home',
    state: {},

    effects: {
        * getContact({ payload }, { call, put }): any {
            let res = yield call(getContact, payload.callNum);
            if (res?.status === REQUEST_CODE.noAuthority) {
                const getToken = yield put({
                    type: 'global/getToken',
                    payload: {
                        grant_type: 'refresh_token',
                        client_id: CLIENT.client_id,
                        client_secret: CLIENT.client_secret,
                        redirect_uri: CLIENT.redirect_uri,
                        refresh_token: payload.tokenInfo?.refresh_token
                    }
                })
                yield call(() => getToken);
                res = yield call(getContact, payload.callNum);
            }
            // 异常判断
            let connectState = res?.code || 'SUCCESS';
            yield put({ type: 'global/save', payload: { connectState } })
            const contactInfo = get(res, ['results', 0, 'properties']) || {};
            contactInfo.displayNotification = connectState === 'SUCCESS';
            return contactInfo;
        },

        * putCallInfo({ payload }, { call, put }): any {
            const res = yield call(putCallInfo, payload.callInfo);
            const params = {
                callId: res.id,
                contactId: payload.contactId
            }
            if (res.id) {
                yield call(putCallToContact, params);
            }
            let connectState = res?.code || 'SUCCESS';
            yield put({ type: 'global/save', payload: { connectState, } })
            return res;
        },

        * createNewContact({ payload }, { call, put }): any {
            let res = yield call(createContact, payload);
            let connectState = res?.code || 'SUCCESS';
            if (res.id) {
                res = yield call(getContactById, res.id);
            }
            yield put({
                type: 'global/save', payload: { connectState }
            })
            return res.properties || {};
        }
    },

    reducers: {
        save(state, action) {
            return { ...state, ...action.payload }
        }
    }
}

export default HomeModal;
