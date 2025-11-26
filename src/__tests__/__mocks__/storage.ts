// Storage Mock
export const getToken = jest.fn().mockReturnValue(null);
export const setToken = jest.fn().mockReturnValue(true);
export const removeToken = jest.fn().mockReturnValue(true);
export const getRefreshToken = jest.fn().mockReturnValue(null);
export const setRefreshToken = jest.fn().mockReturnValue(true);
export const getItem = jest.fn().mockReturnValue(null);
export const setItem = jest.fn().mockReturnValue(true);
export const removeItem = jest.fn().mockReturnValue(true);
