import React, { useCallback } from "react";
import { connect, Dispatch, GlobalModelState, useIntl } from "umi";
import moment from 'moment';
import { getNotificationBody, getValueByConfig } from "@/utils/utils";
import { CallAction, ConfigBlock, ConnectError, ConnectState, Footer } from "@/components";
import { DATE_FORMAT, WAVE_CALL_TYPE } from "@/constant";
import styles from "./index.less";

interface HomeProps {
    getContact: (obj: LooseObject) => Promise<LooseObject>
    putCallInfo: (obj: LooseObject) => Promise<LooseObject>
    account: LooseObject
    tokenInfo: LooseObject
    showConfig: LooseObject
    uploadCall: boolean
    callState: Map<string, boolean>
}

const HomePage: React.FC<HomeProps> = (props) => {
    const {
        getContact,
        putCallInfo,
        tokenInfo,
        account,
        showConfig,
        uploadCall,
        callState,
    } = props;
    const { formatMessage } = useIntl();

    /**
     * 上报通话
     */
    const uploadCallInfo = useCallback((callNum: string, callStartTimeStamp: number, callEndTimeStamp: number, callDirection: string) => {
        if (!uploadCall) {
            return;
        }
        callNum = callNum.replace(/\b(0+)/gi, "");
        getContact({ callNum, tokenInfo }).then(contactInfo => {
            if (!contactInfo?.hs_object_id) {
                return;
            }
            const duration = callEndTimeStamp - callStartTimeStamp;
            const callInfo = {
                properties: {
                    hs_timestamp: `${moment(callStartTimeStamp || undefined).utc(false).format(DATE_FORMAT.format_4)}Z`,
                    hs_call_title: `${contactInfo?.firstname ?? ''} ${contactInfo?.lastname ?? ''}'s call`,
                    hs_call_duration: duration,
                    hs_call_direction: callDirection,
                    hs_call_from_number: "",
                    hs_call_to_number: "",
                    hs_call_status: "COMPLETED"
                }
            };
            if (callDirection === WAVE_CALL_TYPE.in) {
                callInfo.properties.hs_call_from_number = callNum;
            }
            else {
                callInfo.properties.hs_call_to_number = callNum;
            }
            putCallInfo({ callInfo, contactId: contactInfo.hs_object_id }).then(res => {
                console.log("putCallInfo:", callInfo, res);
            });
        });
    }, [uploadCall, tokenInfo])

    const getUrl = (contact: LooseObject) => {
        return contact?.hs_object_id
            ? `https://app.hubspot.com/contacts/${account.portalId}/contact/${contact.hs_object_id}/`
            : `https://app.hubspot.com/contacts/${account.portalId}`;
    };

    const initCallInfo = useCallback((callNum: string) => {
        // callNum 去除前面的0
        callNum = callNum.replace(/\b(0+)/gi, "");
        getContact({ callNum, tokenInfo }).then(contact => {
            console.log("callState", callState);
            if (!contact?.displayNotification || !callState.get(callNum)) {
                return;
            }
            const url = getUrl(contact);
            const pluginPath = sessionStorage.getItem("pluginPath");

            // body对象，
            const body: LooseObject = {
                logo: `<div style="margin-bottom: 12px"><img src="${pluginPath}/logo.svg" alt=""/> HubSpot</div>`,
            }
            if (contact?.hs_object_id) {
                // 将showConfig重复的删除
                const configList = [...new Set<string>(Object.values(showConfig))]
                console.log(configList);
                for (const key in configList) {
                    console.log(configList[key])
                    if (!configList[key]) {
                        continue;
                    }

                    // 取出联系人的信息用于展示
                    const configValue = getValueByConfig(contact, configList[key]);
                    console.log(configValue);
                    if (configList[key] === 'Phone') {
                        body[`config_${key}`] = `<div style="font-weight: bold">${callNum}</div>`
                    }
                    else if (configValue) {
                        body[`config_${key}`] = `<div style="font-weight: bold; display: -webkit-box;-webkit-box-orient: vertical;-webkit-line-clamp: 5;overflow: hidden;word-break: break-all;text-overflow: ellipsis;">${configValue}</div>`
                    }
                }
            }
            else {
                body.phone = `<div style="font-weight: bold;">${callNum}</div>`
            }
            body.action = `<div style="margin-top: 10px;display: flex;justify-content: flex-end;"><button style="background: none; border: none;">
                     <a href=${url} target="_blank" style="color: #62B0FF">
                         ${contact?.hs_object_id ? formatMessage({ id: 'home.detail' }) : formatMessage({ id: 'home.edit' })}
                     </a>
                 </button></div>`;

            console.log("displayNotification");
            // @ts-ignore
            pluginSDK.displayNotification({
                notificationBody: getNotificationBody(body)
            });
        });
    }, [account, tokenInfo, showConfig, callState])

    return (
        <>
            <CallAction initCallInfo={initCallInfo} uploadCallInfo={uploadCallInfo} />
            <ConnectError />
            <div className={styles.homePage}>
                <ConnectState />
                <ConfigBlock />
            </div>
            <Footer url={`https://app.hubspot.com/dashboard-library/${account.portalId}`}
                message={formatMessage({ id: "home.toCRM" })} />
        </>
    );
};

export default connect(
    ({ global }: { global: GlobalModelState }) => ({
        account: global.account,
        uploadCall: global.uploadCall,
        showConfig: global.showConfig,
        tokenInfo: global.tokenInfo,
        callState: global.callState,
    }),
    (dispatch: Dispatch) => ({
        getContact: (payload: LooseObject) =>
            dispatch({
                type: "home/getContact",
                payload
            }),
        putCallInfo: (payload: LooseObject) =>
            dispatch({
                type: "home/putCallInfo",
                payload
            })
    })
)(HomePage);
