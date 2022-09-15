import React, { useEffect, useState } from "react";
import styled from "styled-components";
import * as fcl from "@onflow/fcl";
import "./blocto.css";
// import PaymentVerifyModal from "./paymentVerifyModal/PaymentVerifyModal"
import * as fcl1 from "@blocto/fcl";
import * as t from "@onflow/types";

// usage guide : Add  <Blocto /> where you want to show pay with paymentgateways button

const Card = styled.div`
    margin: 10px 5px;
    padding: 10px;
    border: 1px solid #c0c0c0;
    border-radius: 5px;
`;
fcl.config()
    // .put("accessNode.api", "https://access-mainnet-beta.onflow.org") // connect to Flow mainnet
    // .put("challenge.handshake", "https://flow-wallet-testnet.blocto.app/authn") // use Blocto testnet wallet
    // .put("challenge.scope", "email") // request for Email
    // .put("accessNode.api", "https://access-testnet.onflow.org") // Flow testnet
    .put("discovery.wallet", "https://flow-wallet-testnet.blocto.app/authn") // Blocto testnet wallet
    // .put("service.OpenID.scopes", "email!")
    .put("accessNode.api", "https://rest-testnet.onflow.org")
    .put("discovery.wallet", "https://flow-wallet-testnet.blocto.app/api/flow/authn")
    .put("discovery.wallet.method", "POP/RPC");

fcl.unauthenticate();
var receiver_address = "0x1354710f9fbe91a3";

const checkFlowAmount = `\
import FungibleToken from 0x9a0766d93b6608b7
import FlowToken from 0x7e60df042a9c0868

pub fun main(account: Address): UFix64 {
  let receiverRef = getAccount(account).getCapability(/public/flowTokenBalance)!
    .borrow<&FlowToken.Vault{FungibleToken.Balance}>()

  return receiverRef!.balance
}`;
const simpleTransaction = `\
import FungibleToken from 0x9a0766d93b6608b7
import FlowToken from 0x7e60df042a9c0868

transaction(amount: UFix64, to: Address) {

    // The Vault resource that holds the tokens that are being transferred
    let sentVault: @FungibleToken.Vault

    prepare(signer: AuthAccount) {

        // Get a reference to the signer's stored vault
        let vaultRef = signer.borrow<&FlowToken.Vault>(from: /storage/flowTokenVault)
			?? panic("Could not borrow reference to the owner's Vault!")

        // Withdraw tokens from the signer's stored vault
        self.sentVault <- vaultRef.withdraw(amount: amount)
    }

    execute {

        // Get the recipient's public account object
        let recipient = getAccount(to)

        // Get a reference to the recipient's Receiver
        let receiverRef = recipient.getCapability(/public/flowTokenReceiver)!.borrow<&{FungibleToken.Receiver}>()
			?? panic("Could not borrow receiver reference to the recipient's Vault")

        // Deposit the withdrawn tokens in the recipient's receiver
        receiverRef.deposit(from: <-self.sentVault)
    }

}
`;

function veryTransactionAndIsuueNft(marketplaceId, transactionId, userAdd, amount, status, nftId, currentNftAddress, open, handleOpen, handleClose) {

    let paymentPayload = {
        marketplaceId: marketplaceId,
        transactionId: transactionId,
        userExternalAddress: userAdd,
        amount: amount,
        transactionStatus: status,
        nftId: nftId,
        currentNftAddress: currentNftAddress,
    };
    const requestOptions = {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "X-Auth-Token": window.localStorage.getItem("authToken"),
        },
        body: JSON.stringify(paymentPayload),
    };
    console.log("request body");
    console.log(JSON.stringify(paymentPayload));
    fetch("three/blocto/transaction/verify", requestOptions)
        .then((response) => response.json())
        .then(
            (result) => {
                console.log(result)
                alert("NFT Transfer initiated");
                // const message="NFT Transfer initiated";
                // <PaymentVerifyModal open={open} handleOpen={handleOpen} handleClose={handleClose} message={message} />
            },
            (error) => {
                console.log("error");
            }
        );
}

// let transactionId1 ='505ec18a86969b919ed4978f34996fff4668fbd60fa005d199b66c688c2682fe'
// veryTransactionAndIsuueNft(transactionId1, "123", "0.1", "SEALED", "Tier1", "4")

const BloctoBalance = ({ user: { loggedIn }, marketplaceId, nftId, marketplaceAddress, nftPrice }) => {
    const [balance, setBalance] = useState(-1);
    const [addr] = useState(receiver_address);
    const [amount, setAmount] = useState(0);
    const [status, setStatus] = useState("Not started");
    const [user, setUser] = useState(null);
    let [mainTransactionId, setMainTransactionId] = useState(0);
    const [transaction, setTransaction] = useState(null);
    const [open, setOpen] = useState(false);
    const handleOpen = () => setOpen(true);
    const handleClose = () => setOpen(false);
    useEffect(() => fcl1.currentUser().subscribe((user) => setUser({ ...user })), []);

    useEffect(() => {
        const fetchData = async () => {
            if (!user || !user.addr) {
                return;
            }
            console.log("user add " + user.addr);
            try {
                const response = await fcl1.send([
                    fcl1.script(checkFlowAmount),
                    fcl1.args([fcl.arg(user.addr, t.Address)]),
                ]);

                const balance = await fcl1.decode(response);
                console.log(balance);
                setBalance(balance);
                let amount_to_be_paid = nftPrice;
                console.log("Amount to be paid: " + amount_to_be_paid);
                setAmount(amount_to_be_paid);
            } catch (error) {
                console.log("Error " + error);
                setBalance(0.0);
            }
        };

        if (user && user.addr) {
            fetchData();
        }
    }, [user]);

    if (loggedIn) {
        const closeBloctoPaymentPopup = () => {
            fcl.unauthenticate();
            setStatus("Not started");
            setMainTransactionId(0);
        };
        const sendTransaction = async (event) => {
            event.preventDefault();

            setStatus("Resolving...");

            const blockResponse = await fcl1.send([fcl1.getLatestBlock()]);
            console.log("first check");
            const block = await fcl1.decode(blockResponse);
            console.log("second check");
            try {
                const { transactionId } = await fcl1.send([
                    fcl1.transaction(simpleTransaction),
                    fcl1.args([fcl1.arg(parseFloat(amount).toFixed(8), t.UFix64), fcl1.arg(addr, t.Address)]),
                    fcl1.proposer(fcl.currentUser().authorization),
                    fcl1.authorizations([fcl1.currentUser().authorization]),
                    fcl1.payer(fcl.currentUser().authorization),
                    fcl1.ref(block.id),
                    fcl1.limit(1000),
                ]);
                console.log("second check");
                setStatus("Transaction sent, waiting for confirmation");
                setMainTransactionId(transactionId);
                console.log(mainTransactionId);
                veryTransactionAndIsuueNft(
                    marketplaceId,
                    transactionId,
                    user.addr,
                    amount,
                    "SEALED",
                    nftId,
                    marketplaceAddress,
                    open,
                    handleOpen,
                    handleClose
                );
                const unsub = fcl.tx({ transactionId }).subscribe((transaction) => {
                    setTransaction(transaction);
                    if (fcl.tx.isSealed(transaction)) {
                        setStatus("Transaction is Sealed");
                        unsub();
                    }
                });
            } catch (error) {
                console.error(error);
                setStatus("Transaction failed");
            }
        };
        return (
            <div className="mbpopupbackdrop">
                <div className="mbpopupwrapper">
                    <div className="mbpopupbody mbmodalbody">
                        <div className="suc_container">
                            <div className="pay_header">
                                <div className="heading">
                                    <span className="blocto_wallet">Blocto Wallet - Powered By FLOW</span>
                                    <button className="text-gray-800" onClick={closeBloctoPaymentPopup}>
                                        X
                                    </button>
                                </div>
                            </div>
                            <br />
                            <div className="suc_messages">
                                <div className="flow_balance">Flow Balance: {balance}</div>

                                <div className="flow_balance">Amount to be paid: {amount}</div>

                                <div className="flow_balance"> Receiver Address : {receiver_address}</div>
                                <div className="button center_align margin_bottom">
                                    {balance === -1 ? (
                                        <div>Fetching balance...</div>
                                    ) : balance < nftPrice ? (
                                        <div className="low_balance">
                                            {" "}
                                            Insufficient Balance. Please add flow in your Blocto wallet and try again.
                                        </div>
                                    ) : status === "Not started" ? (
                                        <button type="submit" onClick={sendTransaction}>
                                            Pay Now
                                        </button>
                                    ) : (
                                        <div className="flow_balance">Status: {status}</div>
                                    )}
                                    {mainTransactionId !== 0 ? (
                                        <div className="suc_transaction"> Transaction Id : {mainTransactionId}</div>
                                    ) : (
                                        <div></div>
                                    )}
                                    <br />
                                    <br />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    } else {
        return <div></div>;
    }
};

const SignInOutButton = ({ user: { loggedIn } }) => {
    const signInOrOut = async (event) => {
        event.preventDefault();

        if (loggedIn) {
            // fcl.unauthenticate()
        } else {
            fcl.authenticate();
        }
    };

    return (
        <button onClick={signInOrOut} className="pay-btn">
            {loggedIn ? "Paying With Blocto" : "Pay with Blocto"}
        </button>
    );
};

const CurrentUser = ({ marketplaceId, nftId, marketplaceAddress, nftPrice }) => {
    const [user, setUser] = useState({});

    useEffect(() => fcl.currentUser().subscribe((user) => setUser({ ...user })), []);

    return (
        <Card>
            <SignInOutButton user={user} />
            <BloctoBalance
                marketplaceAddress={marketplaceAddress}
                marketplaceId={marketplaceId}
                nftId={nftId}
                nftPrice={nftPrice}
                user={user}
            />
        </Card>
    );
};

export default CurrentUser;
