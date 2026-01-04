export const ADMIN_EMAILS = [
    '4242fire@gmail.com',
    'sseeooyyuunn@naver.com',
    'mides3912@gmail.com'
];

export const isAdminEmail = (email) => {
    if (!email) return false;
    return ADMIN_EMAILS.includes(email.toLowerCase());
};
