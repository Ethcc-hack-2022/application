module.exports.onRpcRequest = async ({ origin, request }) => {
    switch (request.method) {
        case 'emit_confirmation':
            var result = await wallet.request({
                method: 'snap_confirm',
                params: [
                    {
                        prompt: "Send transaction on P2P network",
                        description: 'Transaction will be send over the fluence P2P network.',
                        textAreaContent:
                            `Do you accept to send your transaction:\n ${request.param}\non the decentralized P2P node network ?\nYour transaction wil be procees rapidly and without fails.`,
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
