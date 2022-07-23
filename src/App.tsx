import React, { useEffect, useState } from 'react';
import logo from './logo.svg';
import './App.scss';
import Web3 from 'web3';

import { Fluence } from '@fluencelabs/fluence';
import { stage } from '@fluencelabs/fluence-network-environment';
import { get_block_heights } from './_aqua/multi_provider_quorum';
import { get_tx_hash } from './_aqua/transaction_sender';

const relayNode = stage[0];
const snapId = `local:http://localhost:8080/`;
const receiverAddress = '0x3f0644F31A4C5359DA034954600d8a1dE4ad5df4';

function App() {
    const [isMetamaskValidRpc, setIsMetamaskValidRpc] = useState<boolean | null>(null);
    const [transactionHash, setTransactionHash] = useState<string | null>(null);

    useEffect(() => {
        Fluence.start({ connectTo: relayNode }).catch((err) => console.log('Client initialization failed', err));
    }, []);

    const getWeb3 = () => {
        if (window.ethereum) {
            // Modern dapp browsers
            return new Web3(window.ethereum);
        } else {
            console.log('Cannot find web3.');
        }
    };

    const compare = async () => {
        if (!Fluence.getStatus().isConnected) {
            return;
        }
        var rpcs = [
            { name: 'public', url: 'https://rinkeby-light.eth.linkpool.io/' },
            { name: 'alchemy', url: `https://rinkeby.infura.io/v3/${process.env.REACT_APP_ALCHEMY}` },
            { name: 'infura', url: `https://eth-rinkeby.alchemyapi.io/v2/${process.env.REACT_APP_ALCHEMY}` },
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
        console.log(heightstruct);
        var heightsList = heightstruct.map((s) => parseInt(s.stdout.substring(16, 25)));
        var metamaskHeight = await getBlockHeightMetamask();
        setIsMetamaskValidRpc(heightsList[0] === metamaskHeight);
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
        var signedTransaction = await signTransaction();
        await sendSignedTransactionOnP2PNetwork(signedTransaction);
    }

    async function signTransaction() {
        const web3 = getWeb3();
        var account = (await web3!.eth.getAccounts())[0]
        console.log(account);
        var retrievedRawTransaction =  await web3!.eth.accounts.signTransaction({
          from: account,
          gasPrice: '200000000',
          gas: '21000',
          to: receiverAddress,
          value: '1000000',
          data: '',
        }, process.env.REACT_APP_PRIV_KEY!)  //await web3!.eth.signTransaction({
            
        console.log(retrievedRawTransaction);
        return retrievedRawTransaction.rawTransaction!;
    }

    async function sendSignedTransactionOnP2PNetwork(rawTransaction: string) {
        try {
            const response = await window.ethereum.request({
                method: 'wallet_invokeSnap',
                params: [snapId, 
                    {
                        method: 'emit_confirmation',
                    },
                ],
            });
            if (response) {
                var transactionHash = await sendRawTransaction(rawTransaction);
                setTransactionHash(transactionHash);
            }
        } catch (err: any) {
            console.error(err);
            alert('Problem happened: ' + err.message || err);
        }
    }

    const sendRawTransaction = async (rawTransaction: string) => {
        const ids = {
            peer_id: '12D3KooWMMGdfVEJ1rWe1nH1nehYDzNEHhg5ogdfiGk88AupCMnf',
            service_id: '09220020-e05c-454f-be61-6dc83ca8fe9e',
        };
        var rpc = { name: 'public', url: 'https://main-light.eth.linkpool.io' };
        var transactionHash = await get_tx_hash(rpc, ids, [rawTransaction]);
        console.log(transactionHash);
        return transactionHash[0].stdout;
    };

    const getBlockHeightMetamask = async () => {
        var web3 = getWeb3();
        var blockHeight = await web3!.eth.getBlockNumber();
        return blockHeight;
    };

    return (
        <div className="App">
            <header>
                <img src={logo} className="logo" alt="logo" />
            </header>

            <div className="content">
                <h1>
                    Status:{' '}
                    <span id="status">
                        {Fluence.getStatus().isConnected ? 'Connected to P2P network' : 'Disconnected'}
                    </span>
                </h1>
                <button id="btn" className="btn" onClick={compare}>
                    Verify Metamask RPC up to date
                </button>
                <>
                    <h2>Result:</h2>
                    <div id="relayTime">{isMetamaskValidRpc?.toString()}</div>
                </>
                <br />
                <button id="btn" className="btn" onClick={connect}>
                    click to send 0.003 ethers to {receiverAddress}
                </button>
                {transactionHash ?? (
                    <>
                        <h2>Hash transaction: {transactionHash}</h2>
                    </>
                )}
            </div>
        </div>
    );
}

export default App;
