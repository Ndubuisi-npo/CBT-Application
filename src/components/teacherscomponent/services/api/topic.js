import { apiFetch, extractErrorMessage } from "../../../../js/lib/api";

export async function getTopics(params = {}) {
    try {
        return await apiFetch('/api/topics', {params}) 
    }catch (error){
        throw new Error(extractErrorMessage (error, 'Unable to fetch topics.'))
    }
}

export async function getTopic(id) {
    try {
        return await apiFetch(`/api/topics/${id}`)
    }catch (error){
        throw new Error(extractErrorMessage (error, 'Unable to fetch topic.'))
    }
}

export async function createTopic(payload){
    try {
        return await apiFetch('/api/topics', 
        {
            method: 'POST',
            body:  JSON.stringify(payload),
        })
    }catch (error){
        throw new Error(extractErrorMessage (error, 'Unable to create topics'))
    }
}

export async function updateTopic(id, payload) {
    try {
        return await apiFetch(`/api/topics/${id}`,
            {
                method: 'PATCH',
                body: JSON.stringify(payload),
            })
    }catch (error){
        throw new Error(extractErrorMessage (error, 'Unable to update topic'))
    }
}

export async function deleteTopic(id) {
    try {
        return await apiFetch(`/api/topics/${id}`,
        {
            method: 'DELETE',
        })
    }catch (error){
        throw new Error(extractErrorMessage (error, 'Unable to delete topic'))
    }
}
