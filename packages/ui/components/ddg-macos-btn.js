import { css, html, LitElement } from 'lit'
import { classMap } from 'lit/directives/class-map.js'

class DDGMacosButton extends LitElement {
    static properties = {
        variant: { type: String }
    }

    constructor () {
        super()
        /** @type {"normal" | "ghost" | "primary"} */
        this.variant = 'normal'
    }

    static styles = css`
        .button {
            height: 20px;
            font-size: 13px;
            line-height: 1;
            padding: 0px 12px;
            align-items: center;
            border-radius: 5px;
            border: 0.5px solid var(--border-color);
            background: var(--button-bg);
            color: var(--button-text);
            box-shadow: 0px 1px 1px 0px var(--border-color), 0px 0px 1px 0px var(--border-color);
        }

        .button:active {
            background: var(--button-active-bg);
        }
        .primary {
            color: white;
            border: 0.5px solid var(--leave-site-btn-border-color);
            background: var(--leave-site-btn-bg);
            box-shadow: 0px 1px 1px 0px var(--leave-site-btn-shadow-color), 0px 0px 1px 0px var(--leave-site-btn-border-color);
        }

        .primary:active {
            background: #798ed6;
        }
        .ghost {
            background: none;
            border: none;
            text-decoration: underline;
            cursor: pointer;
            color: var(--accept-risk-color);
            padding: 0;
        }
    `
    render () {
        const classes = classMap({
            button: this.variant !== 'ghost',
            [this.variant]: true
        })
        return html`<button class=${classes}><slot></slot></button>`
    }
}

customElements.define('ddg-macos-btn', DDGMacosButton)
