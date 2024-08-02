import shieldIcon from '../img/Shield-Alert-96x96.data.svg'
import phishingIcon from '../img/Phishing-Alert-128.svg'

export const loadData = {
    ssl: {
        pageType: 'ssl',
        strings: {
            header: 'Warning: This site may be insecure',
            body: 'The certificate for this site is invalid. You might be connecting to a server that is pretending to be <b>example.com</b> which could put your confidential information at risk',
            advancedInfoHeader: 'DuckDuckGo warns you when a website has an invalid certificate.',
            advancedButton: 'Advanced...',
            leaveSiteButton: 'Leave This Site',
            specificMessage: 'The security certificate for <b>bad.example.com</b> is not trusted by your computer\'s operating system',
            advancedInfoBody: 'It’s possible that the website is misconfigured or that an attacker has compromised your connection.',
            visitSiteBody: 'Accept Risk and Visit Site',
            iconData: shieldIcon
        }
    },
    phishing: {
        pageType: 'phishing',
        strings: {
            header: 'Warning: This site puts your personal information at risk',
            body: 'This website may be impersonating a legitimate site in order to trick you into providing personal information, such as passwords or credit card numbers. <a class="learn-more" href="https://duckduckgo.com/duckduckgo-help-pages/" target="_blank">Learn more</a>',
            advancedInfoHeader: 'DuckDuckGo warns you when a website has been flagged as malicious.',
            advancedButton: 'Advanced...',
            leaveSiteButton: 'Leave This Site',
            specificMessage: '',
            advancedInfoBody: 'Warnings are shown for websites that have been reported to be deceptive. Deceptive websites try to trick you into believing they are legitimate websites you trust. If you understand the risks involved, you can continue anyway.<br><br>See our <a class="learn-more" href="https://duckduckgo.com/duckduckgo-help-pages/" target="_blank">Phishing and Malware Protection help page</a> for more information.',
            visitSiteBody: 'Accept Risk and Visit Site',
            iconData: phishingIcon
        }
    }
}
