
export const makePaginationResponse = (data: any, page: number, limit: number, total: number) => {
    return {
        items: data,
        meta: {
            page,
            limit,
            total,
        },
    }
}