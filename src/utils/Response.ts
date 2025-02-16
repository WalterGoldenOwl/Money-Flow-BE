import { Response } from 'express';

function responseSuccess(res: Response, data: any): Response {
    return res.status(200).json({
        data: data,
        succeeded: true,
        errorMsg: null,
        code: 200,
    })
}


function responseFailure(res: Response, status: number, err?: any): Response {
    return res.status(status).json({
        data: null,
        succeeded: false,
        errorMsg: err ?? null,
        code: status
    })
}

const paginationData = (res: Response, data: any, pagination: any) => {
    return res.status(200).json({
        data: data,
        succeeded: false,
        pagination: pagination,
        errorMsg: null,
        code: 200
    })
}

export { responseSuccess, responseFailure, paginationData };