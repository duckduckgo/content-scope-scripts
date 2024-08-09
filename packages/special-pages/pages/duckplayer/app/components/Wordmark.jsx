import styles from "./Wordmark.module.css";
import dax from "../img/dax.data.svg";
import { h } from "preact";

export function Wordmark() {
    return (
        <div class={styles.wordmark}>
            <div className={styles.logo}>
                <img src={dax} className={styles.img} alt="DuckDuckGo logo"/>
            </div>
            <div className={styles.text}>
                Duck Player
            </div>
        </div>
    )
}
