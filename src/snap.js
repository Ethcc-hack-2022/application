module.exports.onRpcRequest = async ({ origin, request }) => {
    switch (request.method) {
        case 'emit_confirmation':
            var result = await wallet.request({
                method: 'snap_confirm',
                params: [
                    {
                        prompt: `Hello there, ${origin}!`,
                        description: 'This custom confirmation is just for display purposes.',
                        textAreaContent:
                            'But you can edit the snap source code to make it do something, if you want to!',
                    },
                ],
            });
            if (result === true) {
                return true;
            }
            return false;
        default:
            throw new Error('Method not found.');
    }
};
