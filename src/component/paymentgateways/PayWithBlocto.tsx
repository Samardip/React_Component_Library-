import React from "react";
import './Button.css'
import Blocto from './Blocto.js'

interface ButtonProps {
    nftPrice : String;
    marketplaceId : String;
    nftId : String;
    marketplaceAddress : String;
}


const PayWithBlocto = (props: ButtonProps) =>{
    return <Blocto nftPrice={props.nftPrice} marketplaceId={props.marketplaceId} nftId={props.nftId} marketplaceAddress={props.marketplaceAddress}/>
};

export default PayWithBlocto;