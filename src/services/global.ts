import { stringify } from 'qs';
import request from '@/utils/request';

/**
 * 获取联系人列表
 * @returns
 */
export function getUser() {
    return request(`https://api.hubapi.com/settings/v3/users/`);
}

export function getToken(params: LooseObject) {
    return request(`https://api.hubapi.com/oauth/v1/token`, {
        method: 'POST',
        body: stringify(params),
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
        }
    })
}

export function deleteToken(params: LooseObject) {
    return request(`https://api.hubapi.com/oauth/v1/refresh-tokens/${params}`, {
        method: 'DELETE',
    })
}

/**
 * 获取account
 * @returns
 */
export function getAccount() {
    return request(`https://api.hubapi.com/account-info/v3/details`);
}


