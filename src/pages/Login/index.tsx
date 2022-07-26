import React, { useEffect, useState } from 'react';
import { Spin } from 'antd'
import { connect, Dispatch, history, Loading } from 'umi';
import { stringify } from 'qs';
import { CLIENT, SESSION_STORAGE_KEY } from "@/constant";
import styles from './index.less';
import { Alert } from '@/components';

interface LoginProps {
    getToken: (obj: LooseObject) => Promise<LooseObject>
    getUser: (obj: LooseObject) => Promise<LooseObject>
    saveUserConfig: (obj: LooseObject) => void
    save: (obj: LooseObject) => void
    logout: () => void
    loginLoading: boolean | undefined
}

const IndexPage: React.FC<LoginProps> = ({ getUser, getToken, saveUserConfig, save, logout, loginLoading = false }) => {

    const [showAlert, setShowAlert] = useState<boolean>(false);

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
                    showConfig: userConfig.showConfig ?? {
                        first: 'Name',
                        second: 'Phone',
                        third: 'None',
                        forth: 'None',
                        fifth: 'None',
                    }
                }
                save({
                    tokenInfo: userConfig.tokenInfo,
                    uploadCall: userConfig.uploadCall ?? true,
                    showConfig: userConfig.showConfig ?? {
                        first: 'Name',
                        second: 'Phone',
                        third: 'None',
                        forth: 'None',
                        fifth: 'None',
                    }
                })
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
                const userConfig = JSON.parse(data);
                console.log(userConfig);
                if (userConfig.autoLogin && userConfig.tokenInfo?.access_token) {
                    sessionStorage.setItem(SESSION_STORAGE_KEY.token, userConfig.tokenInfo?.access_token);
                    getUserInfo(userConfig);
                    return;
                }
            }
            getCode();
        })
    }

    useEffect(() => {
        try {
            // @ts-ignore
            pluginSDK.getCommonInfo(({ errorCode, data }) => {
                // data.desktopVersion： 1.x.x
                console.log(errorCode, data);
                const { isWaveSupportPlugin } = data
                if (errorCode === 0 && isWaveSupportPlugin) {
                    getUserConfig();
                    return
                }
                else {
                    setShowAlert(true);
                }
            })
        }
        catch (error) {
            console.error(error)
            setShowAlert(true);
        }
    }, [])

    return (
        <>
            <Spin spinning={loginLoading}>
                <div className={styles.homePage}>
                    <Alert show={showAlert} />
                </div>
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
        save: (payload: LooseObject) => dispatch({
            type: 'global/save',
            payload
        }),
        logout: () => dispatch({
            type: 'global/logout'
        })
    })
)(IndexPage);
