import { AUTO_CREATE_CONFIG_DEF, CLIENT, NOTIFICATION_CONFIG_DEF, SESSION_STORAGE_KEY, UPLOAD_CALL_CONFIG_DEF } from "@/constant";
import { Spin } from 'antd';
import { stringify } from 'qs';
import React, { useEffect, useRef } from 'react';
import { Dispatch, Loading, connect, history } from 'umi';
import styles from './index.less';

interface LoginProps {
    getToken: (obj: LooseObject) => Promise<LooseObject>
    getUser: (obj: LooseObject) => Promise<LooseObject>
    saveUserConfig: (obj: LooseObject) => void
    logout: () => void
    loginLoading: boolean | undefined
}

const IndexPage: React.FC<LoginProps> = ({ getUser, getToken, saveUserConfig, logout, loginLoading = false }) => {

    const userConfig = useRef<LooseObject>({});

    const loginSuccess = () => {
        history.replace({ pathname: '/home', });
    }

    const getUserInfo = (userConfig: LooseObject) => {
        getUser(userConfig.tokenInfo).then(res => {
            if (res.id) {
                const config = {
                    ...userConfig,
                    autoLogin: true,
                    uploadCall: userConfig.uploadCall ?? true,
                    notification: userConfig.notification ?? true,
                    autoCreate: userConfig.autoCreate ?? false,
                    autoCreateConfig: userConfig.autoCreateConfig ?? AUTO_CREATE_CONFIG_DEF,
                    uploadCallConfig: userConfig.uploadCallConfig ?? UPLOAD_CALL_CONFIG_DEF,
                    notificationConfig: userConfig.notificationConfig ?? NOTIFICATION_CONFIG_DEF,
                }
                saveUserConfig(config);
                loginSuccess();
                return
            }
            logout();
        });
    }

    const login = () => {
        const data = {
            interceptField: "http://localhost:3000",
            hash: "#/login"
        }

        // 向Wave注册重定向监听
        // @ts-ignore
        pluginSDK.setPluginURLInterceptor(data);

        const params = {
            client_id: CLIENT.client_id,
            scope: CLIENT.scope,
            redirect_uri: CLIENT.redirect_uri,
        }

        window.location.href = `https://app.hubspot.com/oauth/authorize?${stringify(params)}`
    };

    const getAccessToken = (code: string) => {
        const params = {
            grant_type: 'authorization_code',
            client_id: CLIENT.client_id,
            client_secret: CLIENT.client_secret,
            redirect_uri: CLIENT.redirect_uri,
            code,
        }
        getToken(params).then(res => {
            if (res?.access_token) {
                getUserInfo({
                    ...userConfig.current,
                    tokenInfo: res
                });
                return;
            }
            login();
        });
    }

    const getCode = () => {
        const search = window.location.search;
        console.log("search", search);
        if (!(search.indexOf("code") > -1)) {
            login();
            return;
        }
        const fileParams = decodeURIComponent(search).replace("?", '').split('&');
        fileParams.forEach(item => {
            console.log(item);
            const keyValue = item.split("=");
            if (keyValue[0] === "code") {
                console.log(keyValue[1]);
                getAccessToken(keyValue[1]);
            }
        })
    }

    const getUserConfig = () => {
        // @ts-ignore
        pluginSDK.userConfig.getUserConfig(function ({ errorCode, data }) {
            console.log(errorCode, data);
            if (errorCode === 0 && data) {
                const config = JSON.parse(data);
                console.log(config);
                userConfig.current = config;
                if (config.autoLogin && config.tokenInfo?.access_token) {
                    sessionStorage.setItem(SESSION_STORAGE_KEY.token, config.tokenInfo?.access_token);
                    getUserInfo(config);
                    return;
                }
            }
            getCode();
        })
    }

    useEffect(() => {
        getUserConfig();
    }, [])

    return (
        <>
            <Spin spinning={loginLoading}>
                <div className={styles.homePage} />
            </Spin>
        </>
    );
};

export default connect(
    ({ loading }: { loading: Loading }) => ({
        loginLoading: loading.effects['global/getUser'] || loading.effects['global/getToken']
    }),
    (dispatch: Dispatch) => ({
        getToken: (payload: LooseObject) => dispatch({
            type: 'global/getToken',
            payload
        }),
        getUser: (payload: LooseObject) => dispatch({
            type: 'global/getUser',
            payload
        }),
        saveUserConfig: (payload: LooseObject) => dispatch({
            type: 'global/saveUserConfig',
            payload,
        }),
        logout: () => dispatch({
            type: 'global/logout'
        })
    })
)(IndexPage);
