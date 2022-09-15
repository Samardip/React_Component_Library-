import React from "react";
import './ModalScreen.css';

interface ModalMessage {
    label: String;
    visible: boolean;
}

const ModalScreen = (props: ModalMessage) => {
    return (
        props.visible ?
            <div className="outerDiv">
                <div className="innerDiv">
                    {props.label}
                </div>
            </div> : ''

    )
};

export default ModalScreen;