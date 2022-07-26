import request from "@/utils/request";
import { stringify } from "qs";

export function getContact(params: string) {
    const query = {
        query: params,
    }
    return request(`https://api.hubapi.com/crm/v3/objects/contacts/search`, {
        method: 'POST',
        body: JSON.stringify(query),
    })
}

export function putCallInfo(params: LooseObject) {
    return request(`https://api.hubapi.com/crm/v3/objects/calls`, {
        method: 'POST',
        body: JSON.stringify(params)
    })
}

export function putCallToContact(params: LooseObject) {
    return request(`https://api.hubspot.com/crm/v3/objects/calls/${params.callId}/associations/contact/${params.contactId}/194`, {
        method: 'PUT'
    });
}