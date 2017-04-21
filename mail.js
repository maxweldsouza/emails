export function validate (payload) {
    return 'to' in payload && 'from' in payload && 'subject' in payload;
}
