import {h} from "preact";
import cn from "classnames";
import styles from "./RemoteMessagingFramework.module.css"
/**
 * 
 * @param {object} props 
 */

export function RemoteMessagingFramework(props) {
    const {id, messageType, titleText, descriptionText, icon, primaryActionText = "", primaryAction, secondaryActionText = "", secondaryAction} = props;


    return (
        <div id={id} class={styles.root}>{messageType}</div>
    )
}