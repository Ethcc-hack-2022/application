import React, { useEffect, useState } from 'react';
import './App.css';
import Web3 from 'web3';

import { Fluence } from '@fluencelabs/fluence';
import { stage } from '@fluencelabs/fluence-network-environment';
import { get_block_heights } from './_aqua/multi_provider_quorum';
import { get_tx_hash } from './_aqua/transaction_sender';
const relayNode = stage[0];
const snapId = `local:http://localhost:8080/`;
const smartContractAddressRinkeby = '0xd82248b631a39192c9bC3Fd369D062696465B965';
const smartContractAddressChronos = '0x036B3E15d84837c2C5Fa4FFB90b618A483AE4a22';
const smartContractAddressGnosis = '0x036B3E15d84837c2C5Fa4FFB90b618A483AE4a22';
const smartContractAddressMumbai = '0xA0Dc956169909A59D2b6288114f51EBB8602FBD1';
const smartContractAddressNeon = '';

function App() {
    const [isMetamaskValidRpc, setIsMetamaskValidRpc] = useState<boolean | null>(null);
    const [retrievedTransactionHashRinkeby, setRetrievedTransactionHashRinkeby] = useState<string | null>(null);
    const [retrievedTransactionHashChronos, setRetrievedTransactionHashChronos] = useState<string | null>(null);
    const [retrievedTransactionHashGnosis, setRetrievedTransactionHashGnosis] = useState<string | null>(null);
    const [retrievedTransactionHashMumbai, setRetrievedTransactionHashMumbai] = useState<string | null>(null);
    const [fluentStatus, setFluentStatus] = useState<boolean>(false);
    const [requested, setRequested] = useState<boolean>(false);

    useEffect(() => {
        Fluence.start({ connectTo: relayNode }).catch((err) => console.log('Client initialization failed', err));
        setFluentStatus(true);
    }, []);

    const getWeb3 = (chain: string) => {
        switch (chain) {
            case 'mumbai':
                return new Web3(new Web3.providers.HttpProvider(`https://polygon-mumbai.g.alchemy.com/v2/${process.env.REACT_APP_ALCHEMY_MUMBAI}`)); 
            case 'chronos':
                return new Web3("https://cronos-testnet-3.crypto.org:8545");
            default:
                if (window.ethereum) {
                    // Modern dapp browsers
                    return new Web3(window.ethereum);
                } else {
                    console.log('Cannot find web3.');
                }
        }
    };

    const compare = async () => {
        if (!Fluence.getStatus().isConnected) {
            return;
        }
        var rpcs = [
            { name: 'public', url: 'https://rinkeby-light.eth.linkpool.io/' },
            { name: 'infura', url: `https://rinkeby.infura.io/v3/${process.env.REACT_APP_INFURA}` },
            { name: 'alchemy', url: `https://eth-rinkeby.alchemyapi.io/v2/${process.env.REACT_APP_ALCHEMY}` },
        ];
        var addresses = [
            {
                peer_id: '12D3KooWJ4bTHirdTFNZpCS72TAzwtdmavTBkkEXtzo6wHL25CtE',
                service_id: '4deacc90-9c9c-414b-9ebc-be0e9dea38de',
            },
            {
                peer_id: '12D3KooWAKNos2KogexTXhrkMZzFYpLHuWJ4PgoAhurSAv7o5CWA',
                service_id: 'f61c5f73-75ae-4b65-81fc-4933b6459b0c',
            },
            {
                peer_id: '12D3KooWMMGdfVEJ1rWe1nH1nehYDzNEHhg5ogdfiGk88AupCMnf',
                service_id: 'd345cf40-7fc8-4942-a43f-b7e9c22785ec',
            },
        ];
        const heightstruct = await get_block_heights(rpcs, addresses);
        var heightsList = heightstruct.map((s) => parseInt(s.stdout.substring(16, 25)));
        console.log(heightsList);
        var metamaskHeight = await getBlockHeightMetamask();
        console.log(metamaskHeight);
        setIsMetamaskValidRpc(heightsList[0] === metamaskHeight);
        setRequested(true);
    };

    async function connect() {
        await window.ethereum.request({
            method: 'wallet_enable',
            params: [
                {
                    wallet_snap: { [snapId]: {} },
                },
            ],
        });
        const [signedTransactionRinkeby, transaction] = await signTransactionRinkeby();
        const signedTransactionChronos = await signTransactionChronos();
        const signedTransactionGnosis = await signTransactionGnosis();
        const signedTransactionMumbai = await signTransactionMumbai();
        const signedTransactionNeon = await signTransactionNeon();
        await sendRawTransaction(
            signedTransactionRinkeby,
            transaction,
            signedTransactionChronos,
            signedTransactionGnosis,
            signedTransactionMumbai,
            signedTransactionNeon,
        );
    }

    async function signTransactionRinkeby() {
        const web3 = getWeb3('');
        const chainId = await web3!.eth.getChainId();
        const account = (await web3!.eth.getAccounts())[0];
        var data = web3!.eth.abi.encodeFunctionCall(
            {
                name: 'mintToken',
                type: 'function',
                inputs: [
                    {
                        type: 'address',
                        name: 'recipient',
                    },
                ],
            },
            [account],
        );
        var transactionRinkeby = {
            from: account,
            //   gasPrice: '200000000',
            gas: '95000',
            to: smartContractAddressRinkeby,
            chainId,
            //   nonce,
            data,
        };
        var retrievedRawTransactionRinkeby = await web3!.eth.accounts.signTransaction(
            transactionRinkeby,
            process.env.REACT_APP_PRIV_KEY!,
        );

        console.log(retrievedRawTransactionRinkeby);
        return [retrievedRawTransactionRinkeby.rawTransaction!, JSON.stringify(transactionRinkeby)];
    }

    async function signTransactionChronos() {
        const web3 = getWeb3('chronos');
        // const account = (await web3!.eth.getAccounts())[0];
        const account= "0x3f0644F31A4C5359DA034954600d8a1dE4ad5df4";
        const nonce = await web3!.eth.getTransactionCount(account);
        var data = web3!.eth.abi.encodeFunctionCall(
            {
                name: 'mintToken',
                type: 'function',
                inputs: [
                    {
                        type: 'address',
                        name: 'recipient',
                    },
                ],
            },
            [account],
        );
        var transactionChronos = {
            from: account,
            gasPrice: '3943807131406',
            gas: '100000',
            to: smartContractAddressChronos,
            chainId: 338,
            nonce,
            data,
        };
        var retrievedRawTransactionChronos = await web3!.eth.accounts.signTransaction(
            transactionChronos,
            process.env.REACT_APP_PRIV_KEY!,
        );

        console.log(retrievedRawTransactionChronos);
        return retrievedRawTransactionChronos.rawTransaction!;
    }

    async function signTransactionGnosis() {
        const web3 = getWeb3('');
        const account = (await web3!.eth.getAccounts())[0];
        var data = web3!.eth.abi.encodeFunctionCall(
            {
                name: 'mintToken',
                type: 'function',
                inputs: [
                    {
                        type: 'address',
                        name: 'recipient',
                    },
                ],
            },
            [account],
        );
        var transactionGnosis = {
            from: account,
            // gasPrice: '200000000',
            gas: '155000',
            to: smartContractAddressGnosis,
            chainId: 77,
            //   nonce,
            data,
        };
        var retrievedRawTransactionGnosis = await web3!.eth.accounts.signTransaction(
            transactionGnosis,
            process.env.REACT_APP_PRIV_KEY!,
        );

        console.log(retrievedRawTransactionGnosis);
        return retrievedRawTransactionGnosis.rawTransaction!;
    }

    async function signTransactionMumbai() {
        const web3 = getWeb3('mumbai');
        const account = (await web3!.eth.getAccounts())[0];
        const nonce = await web3!.eth.getTransactionCount(account);
        console.log(nonce);
        var data = web3!.eth.abi.encodeFunctionCall(
            {
                name: 'mintToken',
                type: 'function',
                inputs: [
                    {
                        type: 'address',
                        name: 'recipient',
                    },
                ],
            },
            [account],
        );
        var transactionMumbai = {
            from: account,
            //   gasPrice: '200000000',
            gas: '9500000',
            to: smartContractAddressMumbai,
            chainId: 80001,
            nonce,
            data,
        };
        var retrievedRawTransactionMumbai = await web3!.eth.accounts.signTransaction(
            transactionMumbai,
            process.env.REACT_APP_PRIV_KEY!,
        );

        console.log(retrievedRawTransactionMumbai);
        return retrievedRawTransactionMumbai.rawTransaction!;
    }

    async function signTransactionNeon() {
        const web3 = getWeb3('');
        const chainId = await web3!.eth.getChainId();
        const account = (await web3!.eth.getAccounts())[0];
        var data = web3!.eth.abi.encodeFunctionCall(
            {
                name: 'mintToken',
                type: 'function',
                inputs: [
                    {
                        type: 'address',
                        name: 'recipient',
                    },
                ],
            },
            [account],
        );
        var transactionNeon = {
            from: account,
            //   gasPrice: '200000000',
            gas: '95000',
            to: smartContractAddressMumbai,
            chainId,
            //   nonce,
            data,
        };
        var retrievedRawTransactionNeon = await web3!.eth.accounts.signTransaction(
            transactionNeon,
            process.env.REACT_APP_PRIV_KEY!,
        );

        console.log(retrievedRawTransactionNeon);
        return retrievedRawTransactionNeon.rawTransaction!;
    }

    async function sendRawTransaction(
        rawTransactionRinkeby: string,
        transaction: string,
        rawTransactionChronos: string,
        rawTransactionGnosis: string,
        rawTransactionMumbai: string,
        rawTransactionNeon: string,
    ) {
        try {
            const response = await window.ethereum.request({
                method: 'wallet_invokeSnap',
                params: [
                    snapId,
                    {
                        method: 'emit_confirmation',
                        param: transaction,
                    },
                ],
            });
            if (response) {
                var transactionHashes = await sendSignedTransactionOnP2PNetwork(
                    rawTransactionRinkeby,
                    rawTransactionChronos,
                    rawTransactionGnosis,
                    rawTransactionMumbai,
                    rawTransactionNeon,
                );
                console.log(transactionHashes);
                if (transactionHashes[0] !== '') {
                    var toSave = JSON.parse(transactionHashes[0])['tx-hash'];
                    setRetrievedTransactionHashRinkeby(toSave);
                }
                if (transactionHashes[1] !== '') {
                    var toSave = JSON.parse(transactionHashes[1])['tx-hash'];
                    setRetrievedTransactionHashChronos(toSave);
                }
                if (transactionHashes[2] !== '') {
                    var toSave = JSON.parse(transactionHashes[2])['tx-hash'];
                    setRetrievedTransactionHashGnosis(toSave);
                }
                if (transactionHashes[3] !== '') {
                    var toSave = JSON.parse(transactionHashes[3])['tx-hash'];
                    setRetrievedTransactionHashMumbai(toSave);
                }
            } else {
                alert('You rejected the transaction. Please repeat the proccess.');
            }
        } catch (err: any) {
            console.error(err);
            alert('Problem happened: ' + err.message || err);
        }
    }

    const sendSignedTransactionOnP2PNetwork = async (
        rawTransactionRinkeby: string,
        rawTransactionChronos: string,
        rawTransactionGnosis: string,
        rawTransactionMumbai: string,
        rawTransactionNeon: string,
    ) => {
        const ids = {
            peer_id: '12D3KooWMMGdfVEJ1rWe1nH1nehYDzNEHhg5ogdfiGk88AupCMnf',
            service_id: '09220020-e05c-454f-be61-6dc83ca8fe9e',
        };

        var rpc_rinkeby = { name: 'public', url: 'https://rinkeby-light.eth.linkpool.io/' };
        var transactionHashRinkeby = await get_tx_hash(rpc_rinkeby, ids, [rawTransactionRinkeby]);
        console.log(transactionHashRinkeby);
        if (transactionHashRinkeby[0].stderr != '') {
            alert(`You got an error on your transaction on rinkeby: ${transactionHashRinkeby[0].stderr}`);
        }

        var rpc_chronos = { name: 'chronos', url: 'https://cronos-testnet-3.crypto.org:8545' };
        var transactionHashChronos = await get_tx_hash(rpc_chronos, ids, [rawTransactionChronos]);
        if (transactionHashChronos[0].stderr != '') {
            alert(`You got an error on your transaction on chronos: ${transactionHashChronos[0].stderr}`);
        }

        var rpc_gnosis = { name: 'gnosis', url: 'https://sokol.poa.network' };
        var transactionHashGnosis = await get_tx_hash(rpc_gnosis, ids, [rawTransactionGnosis]);
        if (transactionHashGnosis[0].stderr != '') {
            alert(`You got an error on your transaction on gnosis: ${transactionHashGnosis[0].stderr}`);
        }

        var rpc_mumbai = {
            name: 'mumbai',
            url: `https://polygon-mumbai.g.alchemy.com/v2/${process.env.REACT_APP_ALCHEMY_MUMBAI}`,
        };
        var transactionHashMumbai = await get_tx_hash(rpc_mumbai, ids, [rawTransactionMumbai]);
        if (transactionHashMumbai[0].stderr != '') {
            alert(`You got an error on your transaction on mumbai: ${transactionHashMumbai[0].stderr}`);
        }

        // var rpc_neon = {
        //     name: 'neon',
        //     url: `https://polygon-mumbai.g.alchemy.com/v2/${process.env.REACT_APP_ALCHEMY_MUMBAI}`,
        // };
        // var transactionHashNeon = await get_tx_hash(rpc_neon, ids, [rawTransactionNeon]);
        // if (transactionHashNeon[0].stderr != '') {
        //     alert(`You got an error on your transaction on gnosis: ${transactionHashNeon[0].stderr}`);
        // }

        return [
            transactionHashRinkeby[0].stdout,
            transactionHashChronos[0].stdout,
            transactionHashGnosis[0].stdout,
            transactionHashMumbai[0].stdout,
        ];
    };

    const getBlockHeightMetamask = async () => {
        var web3 = getWeb3('');
        var blockHeight = await web3!.eth.getBlockNumber();
        return blockHeight;
    };

    return (
        <div className="App">
            <header>
                <h1>Welcome to the decentralized Metamask</h1>
                {/* <img src={logo} className="logo" alt="logo" /> */}
            </header>

            <div className="content">
                <h1>
                    Status: <span id="status">{fluentStatus ? 'Connected to P2P network' : 'Disconnected'}</span>
                </h1>

                <button
                    id="btn"
                    style={{ borderRadius: '4px', fontSize: '20px', backgroundColor: '#ccffcc' }}
                    onClick={compare}
                >
                    Verify Metamask RPC is up to date
                </button>
                {requested && (
                    <div className="containerInline">
                        <br />
                        <h2>Result: </h2>
                        <p>
                            {isMetamaskValidRpc
                                ? ' Your metamask RPC is up to date !'
                                : 'Too bad, your metamask RPC is not up to date.'}
                        </p>
                    </div>
                )}

                <br />
                <button
                    id="btn"
                    style={{ borderRadius: '4px', fontSize: '20px', backgroundColor: '#ccffcc' }}
                    onClick={connect}
                >
                    Click here to mint NFT on Gnosis, polygon, Ethereum, Chronos and Neonlabs
                </button>
                {retrievedTransactionHashRinkeby && (
                    <>
                        <p>Transaction Hash Rinkeby: {retrievedTransactionHashRinkeby}</p>
                    </>
                )}
                {retrievedTransactionHashChronos && (
                    <>
                        <p>Transaction Hash Chronos: {retrievedTransactionHashChronos}</p>
                    </>
                )}
                {retrievedTransactionHashGnosis && (
                    <>
                        <p>Transaction Hash Gnosis: {retrievedTransactionHashGnosis}</p>
                    </>
                )}
                {retrievedTransactionHashMumbai && (
                    <>
                        <p>Transaction Hash Mumbai: {retrievedTransactionHashMumbai}</p>
                    </>
                )}
            </div>
        </div>
    );
}

export default App;
