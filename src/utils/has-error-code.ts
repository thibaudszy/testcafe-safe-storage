export default function hasErrorCode (error: unknown): error is { code: unknown } {
    if (typeof error !== 'object' || !error)
        return false;

    return 'code' in error;
}
