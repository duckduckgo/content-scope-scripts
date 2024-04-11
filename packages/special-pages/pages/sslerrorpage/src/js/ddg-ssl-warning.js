import { css, LitElement } from 'lit'
import { html } from 'lit/html.js'
import { unsafeHTML } from 'lit/directives/unsafe-html.js'
import { classMap } from 'lit/directives/class-map.js'
import shieldIcon from '../img/Shield-Alert-96x96.data.svg'
import '../../../../../ui/components/ddg-macos-btn.js'

class DDGSSLWarning extends LitElement {
    static properties = {
        strings: { type: Object },
        state: { type: String }
    }

    constructor () {
        super()
        this.strings = {}
        this.state = 'closed'
    }

    toggle () {
        this.state = 'open'
    }

    acceptRisk () {
        this.dispatchEvent(new Event('visit-site'))
    }

    leaveSite () {
        this.dispatchEvent(new Event('leave-site'))
    }

    get infoClasses () {
        return classMap({
            'advanced-info': true,
            closed: this.state === 'closed'
        })
    }

    render () {
        return html`
            <div class="full-container" data-state="${this.state}">
                <div class="warning-container">
                    <h1 class="warning-header">
                        <img src="${shieldIcon}" alt="Warning" class="watermark">
                        ${this.strings.header}
                    </h1>
                    <p class="warning-text">${unsafeHTML(this.strings.body)}</p>
                    <div class="buttons">
                        <ddg-macos-btn ?hidden=${this.state === 'open'} variant="secondary" @click=${this.toggle}>${this.strings.advancedButton}</ddg-macos-btn>
                        <ddg-macos-btn variant="primary" @click=${this.leaveSite}>${this.strings.leaveSiteButton}</ddg-macos-btn>
                    </div>
                </div>
                <div class=${this.infoClasses}>
                    <p>${this.strings.advancedInfoHeader}</p>
                    <p>${unsafeHTML(this.strings.specificMessage)} ${this.strings.advancedInfoBody}</p>
                    <ddg-macos-btn variant="ghost" @click=${this.acceptRisk}>
                        ${this.strings.visitSiteBody}
                    </ddg-macos-btn>
                </div>
            </div>
        `
    }

    static styles = css`
        .full-container {
            display: flex;
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, calc(-50% - 16px));
            width: 504px;
            min-width: 400px;
            flex-direction: column;
            align-items: flex-start;
            background: var(--warning-container-bg);
            border-radius: 8px;
            border: 1px solid var(--border-color);
            overflow: hidden;
        }
        
        /* when the screen is not very tall, pin to the top */
        .full-container[data-state=closed] {
            @media (max-height: 320px) {
                top: 40px;
                transform: translateX(-50%)
            }
        }

        .full-container[data-state=open] {
            @media (max-height: 460px) {
                top: 40px;
                transform: translateX(-50%)
            }
        }
        
        .warning-container {
            overflow: hidden;
            padding: 32px 40px;
            gap: 16px;
            background: var(--warning-container-bg);
            margin-block: 0;
        }

        .warning-header {
            display: flex;
            align-items: center;
            gap: 16px;
            font-size: 17px;
            margin-block: 0;
            min-height: 32px;
            position: relative;
            padding-left: 48px;
        }

        .warning-header img {
            position: absolute;
            left: -8px;
            top: 50%;
            transform: translateY(-50%);
            pointer-events: none;
        }

        .warning-text {
            font-size: 13px;
            line-height: 16px;
            margin-block: 16px;
        }

        .advanced-info {
            box-shadow: inset 0 1px 0 0 var(--border-color);
            overflow: hidden;
            padding: 24px 40px;
            align-items: flex-start;
            background: var(--advanced-info-bg);
            font-size: 13px;
            line-height: 14px;
            color: var(--text-color);
            transition: padding 200ms, height 200ms;
            opacity: 1;
        }

        .advanced-info.closed {
            opacity: 0;
            height: 0;
            padding-block: 0;
            overflow: hidden;
        }

        .advanced-info p:first-child {
            margin-top: 0;
        }

        .advanced-info p:last-child {
            margin-bottom: 0;
        }

        .buttons {
            display: flex;
            justify-content: flex-end;
            gap: 6px;
            padding-block-start: 8px;
        }
    `
}

customElements.define('ddg-ssl-warning', DDGSSLWarning)
