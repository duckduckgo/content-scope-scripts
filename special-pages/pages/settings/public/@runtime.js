export async function process(args, initialSetup) {
    const dynamic = await import('/@native.js');
    const result = await dynamic.process(args, initialSetup);
    return result;
}
