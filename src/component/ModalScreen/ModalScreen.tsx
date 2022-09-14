import React from "react";

interface ModalMessage {
    label : String;
    visible : boolean;
}

const ModalScreen = (props: ModalMessage) =>{
    return (
        props.visible?
        <div style={{
            height:"100vh",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            backgroundColor: "#f1eded"
        }}>
            <div style={{
                height: "25rem",
                width: "31rem",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                backgroundColor: "white",
                fontWeight:"bold",
                fontSize:"60px"
            }}>
                {props.label}
            </div>
        </div>:''
        
    )
};

export default ModalScreen;