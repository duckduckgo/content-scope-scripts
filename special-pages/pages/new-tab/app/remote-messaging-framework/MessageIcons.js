import { h, Fragment } from 'preact'

export default function MessageIcons(props) {
    const { name } = props
    return (
        <>
            {name === 'Announce' && (
                <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 48 48" fill="none">
                    <path fill-rule="evenodd" clip-rule="evenodd" d="M19 28.5V31.8648C19 33.5005 19.9958 34.9713 21.5144 35.5787C24.1419 36.6297 27 34.6947 27 31.8648V28.9857H29V31.8648C29 36.1096 24.7128 39.0122 20.7717 37.4357C18.4937 36.5245 17 34.3183 17 31.8648V28.5H19Z" fill="#557FF3" />
                    <path d="M36.5 11.5L9.5 19V28L36.5 35.5V11.5Z" fill="#8FABF9" />
                    <path d="M36.5 27L9.5 25V28L36.5 35.5V27Z" fill="#7295F6" />
                    <path fill-rule="evenodd" clip-rule="evenodd" d="M36.977 15.2856C37.0954 15.825 36.7541 16.3583 36.2146 16.4767L15.7146 20.9767C15.1752 21.0951 14.6419 20.7538 14.5235 20.2144C14.4051 19.6749 14.7464 19.1416 15.2858 19.0232L35.7858 14.5232C36.3252 14.4048 36.8585 14.7461 36.977 15.2856Z" fill="#ADC2FC" />
                    <path fill-rule="evenodd" clip-rule="evenodd" d="M40.25 24C40.25 23.5858 40.5858 23.25 41 23.25H44C44.4142 23.25 44.75 23.5858 44.75 24C44.75 24.4142 44.4142 24.75 44 24.75H41C40.5858 24.75 40.25 24.4142 40.25 24Z" fill="#CCCCCC" />
                    <path fill-rule="evenodd" clip-rule="evenodd" d="M39.3506 19.3751C39.1435 19.0164 39.2664 18.5577 39.6251 18.3506L42.2232 16.8506C42.5819 16.6435 43.0406 16.7664 43.2477 17.1251C43.4548 17.4838 43.3319 17.9425 42.9732 18.1496L40.3751 19.6496C40.0164 19.8567 39.5577 19.7338 39.3506 19.3751Z" fill="#CCCCCC" />
                    <path fill-rule="evenodd" clip-rule="evenodd" d="M39.3506 28.6251C39.5577 28.2664 40.0164 28.1435 40.3751 28.3506L42.9732 29.8506C43.3319 30.0577 43.4548 30.5164 43.2477 30.8751C43.0406 31.2338 42.5819 31.3567 42.2232 31.1496L39.6251 29.6496C39.2664 29.4425 39.1435 28.9838 39.3506 28.6251Z" fill="#CCCCCC" />
                    <path d="M35 11.5C35 10.6716 35.6716 10 36.5 10C37.3284 10 38 10.6716 38 11.5V35.5C38 36.3284 37.3284 37 36.5 37C35.6716 37 35 36.3284 35 35.5V11.5Z" fill="#3969EF" />
                    <path d="M8 19C8 18.1716 8.67157 17.5 9.5 17.5C10.3284 17.5 11 18.1716 11 19V28C11 28.8284 10.3284 29.5 9.5 29.5C8.67157 29.5 8 28.8284 8 28V19Z" fill="#3969EF" />
                </svg>
            )}
            {name === "AppUpdate" && (
                <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 48 48" fill="none">
                    <path d="M25 39C33.2843 39 40 32.2843 40 24C40 15.7157 33.2843 9 25 9C16.7157 9 10 15.7157 10 24C10 32.2843 16.7157 39 25 39Z" fill="#399F29" />
                    <path d="M23 9H25V39H23V9Z" fill="#399F29" />
                    <path d="M23 39C31.2843 39 38 32.2843 38 24C38 15.7157 31.2843 9 23 9C14.7157 9 8 15.7157 8 24C8 32.2843 14.7157 39 23 39Z" fill="#4CBA3C" />
                    <path fill-rule="evenodd" clip-rule="evenodd" d="M25.3389 18.8067C22.6654 17.4255 19.3882 18.4284 17.8588 21.1608L17.8531 21.1668C17.3471 22.0676 17.0999 23.0465 17.0711 24.0193C17.0596 24.5358 16.7434 24.9802 16.2662 25.1123L14.3631 25.6348C14.0296 25.7249 13.7019 25.4786 13.6674 25.1183C13.4892 23.1726 13.8686 21.1548 14.8863 19.3412C17.3873 14.8792 22.7862 13.3058 27.1041 15.708C27.2995 15.8161 27.541 15.75 27.6503 15.5518L28.3919 14.2247C28.5759 13.9004 29.0416 13.9664 29.1336 14.3327L30.4215 19.5093C30.479 19.7315 30.3525 19.9657 30.1341 20.0258L25.1952 21.377C24.8445 21.4731 24.557 21.0767 24.741 20.7524L25.4999 19.4012C25.6149 19.1911 25.5459 18.9148 25.3389 18.8067ZM20.2104 29.2678C22.9868 30.649 26.39 29.6462 27.9782 26.9137L27.9842 26.9077C28.5096 26.0069 28.7664 25.028 28.7962 24.0552C28.8082 23.5387 29.1366 23.0943 29.6321 22.9622L31.6084 22.4397C31.9547 22.3497 32.295 22.5959 32.3309 22.9562C32.5159 24.9019 32.1219 26.9197 31.0651 28.7333C28.4678 33.1953 22.8614 34.7687 18.3774 32.3666C18.1744 32.2585 17.9236 32.3245 17.8102 32.5227L17.04 33.8499C16.8489 34.1742 16.3653 34.1081 16.2698 33.7418L14.9323 28.5652C14.8726 28.343 15.004 28.1088 15.2309 28.0487L20.3597 26.6975C20.7239 26.6015 21.0224 26.9978 20.8313 27.3221L20.0432 28.6733C19.9238 28.8835 19.9955 29.1597 20.2104 29.2678Z" fill="white" />
                </svg>
            )}
            {name === "CriticalUpdate" && (
                <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 48 48" fill="none">
                    <path d="M34.3532 25.565C29.3703 26.1337 25.4998 30.3648 25.4998 35.4999C25.4998 36.8807 24.3805 38 22.9997 38H14.4312C11.0068 38 8.83727 34.3271 10.4901 31.328L21.0585 12.1513C21.5331 11.2902 22.2193 10.6679 22.9998 10.2846V9.82495H24.8743C26.4585 9.78177 28.0623 10.5572 28.9408 12.1513L35.3579 23.7953C35.7802 24.5615 35.2225 25.4657 34.3532 25.565Z" fill="#E2A412" />
                    <path d="M34.3344 25.5671C29.3606 26.1444 25.4998 30.3713 25.4998 35.4999C25.4998 36.8807 24.3805 38 22.9997 38H12.4312C9.00682 38 6.83727 34.3271 8.4901 31.328L19.0585 12.1513C20.7692 9.04724 25.2301 9.04724 26.9408 12.1513L34.3344 25.5671Z" fill="#F9BE1A" />
                    <path d="M35.5 43.5C39.9183 43.5 43.5 39.9183 43.5 35.5C43.5 31.0817 39.9183 27.5 35.5 27.5C31.0817 27.5 27.5 31.0817 27.5 35.5C27.5 39.9183 31.0817 43.5 35.5 43.5Z" fill="#4CBA3C" />
                    <path fill-rule="evenodd" clip-rule="evenodd" d="M36.7474 32.7303C35.3216 31.9936 33.5737 32.5285 32.758 33.9858L32.755 33.989C32.4851 34.4694 32.3533 34.9915 32.3379 35.5104C32.3318 35.7858 32.1631 36.0228 31.9086 36.0933L30.8936 36.3719C30.7158 36.42 30.541 36.2887 30.5226 36.0965C30.4276 35.0588 30.6299 33.9826 31.1727 33.0153C32.5066 30.6356 35.386 29.7965 37.6888 31.0776C37.7931 31.1353 37.9219 31.1001 37.9801 30.9944L38.3757 30.2865C38.4738 30.1136 38.7222 30.1488 38.7713 30.3442L39.4581 33.105C39.4888 33.2235 39.4214 33.3484 39.3048 33.3805L36.6708 34.1011C36.4837 34.1524 36.3304 33.941 36.4285 33.768L36.8333 33.0474C36.8946 32.9353 36.8578 32.7879 36.7474 32.7303ZM34.0122 38.3096C35.4929 39.0462 37.308 38.5113 38.1551 37.054L38.1582 37.0508C38.4385 36.5704 38.5754 36.0483 38.5913 35.5295C38.5977 35.254 38.7728 35.017 39.0371 34.9466L40.0912 34.6679C40.2758 34.6199 40.4574 34.7512 40.4765 34.9434C40.5752 35.9811 40.365 37.0572 39.8014 38.0245C38.4162 40.4042 35.4261 41.2434 33.0346 39.9622C32.9263 39.9046 32.7926 39.9398 32.7321 40.0455L32.3213 40.7533C32.2194 40.9263 31.9615 40.891 31.9105 40.6957L31.1972 37.9348C31.1654 37.8163 31.2355 37.6914 31.3565 37.6594L34.0918 36.9387C34.2861 36.8875 34.4453 37.0989 34.3434 37.2718L33.9231 37.9925C33.8594 38.1046 33.8976 38.2519 34.0122 38.3096Z" fill="white" />
                    <path d="M46.2507 29.5C46.3994 29.5 46.5481 29.56 46.6618 29.677C46.8892 29.9109 46.8892 30.2919 46.6618 30.5258L45.4956 31.7256C45.2682 31.9596 44.898 31.9596 44.6706 31.7256C44.4431 31.4917 44.4431 31.1107 44.6706 30.8768L45.8367 29.677C45.9505 29.56 46.0991 29.5 46.2478 29.5H46.2507Z" fill="#CCCCCC" />
                    <path d="M45.6676 34.8991H47.4169C47.7376 34.8991 48 35.1691 48 35.499C48 35.829 47.7376 36.0989 47.4169 36.0989H45.6676C45.3469 36.0989 45.0845 35.829 45.0845 35.499C45.0845 35.1691 45.3469 34.8991 45.6676 34.8991Z" fill="#CCCCCC" />
                    <path d="M44.6765 39.2759C44.7902 39.1589 44.9389 39.0989 45.0876 39.0989H45.0905C45.2392 39.0989 45.3879 39.1589 45.5016 39.2759L46.6678 40.4757C46.8952 40.7096 46.8952 41.0906 46.6678 41.3245C46.4403 41.5585 46.0701 41.5585 45.8427 41.3245L44.6765 40.1247C44.4491 39.8908 44.4491 39.5098 44.6765 39.2759Z" fill="#CCCCCC" />
                    <path d="M23 34C24.1046 34 25 33.1046 25 32C25 30.8954 24.1046 30 23 30C21.8954 30 21 30.8954 21 32C21 33.1046 21.8954 34 23 34Z" fill="#92540C" />
                    <path d="M22.5637 16C21.7108 16 21.0295 16.7103 21.065 17.5624L21.44 26.5624C21.4735 27.3659 22.1346 28 22.9387 28H23.0611C23.8653 28 24.5264 27.3659 24.5598 26.5624L24.9348 17.5624C24.9704 16.7103 24.2891 16 23.4361 16H22.5637Z" fill="#92540C" />
                </svg>
            )}
            {name === "DDGAnnounce" && (
                <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 48 48" fill="none">
                    <rect x="8" y="8" width="32" height="32" rx="16" fill="#DE5833" />
                    <path fill-rule="evenodd" clip-rule="evenodd" d="M27.6052 38.3435C26.933 37.0366 26.2903 35.8342 25.8913 35.0388C24.8308 32.9152 23.7649 29.9212 24.2497 27.9903C24.338 27.6395 23.2508 14.9993 22.4822 14.5922C21.6279 14.1369 20.5768 13.4148 19.6154 13.2541C19.1276 13.176 18.488 13.213 17.988 13.2803C17.8992 13.2923 17.8955 13.452 17.9804 13.4808C18.3087 13.592 18.7072 13.7851 18.9421 14.077C18.9866 14.1323 18.9269 14.2192 18.856 14.2218C18.6346 14.23 18.2329 14.3228 17.703 14.773C17.6417 14.825 17.6926 14.9217 17.7715 14.9061C18.9104 14.6808 20.0736 14.7918 20.7591 15.4149C20.8036 15.4553 20.7803 15.5278 20.7223 15.5436C14.7736 17.1602 15.9512 22.3349 17.5348 28.6852C19.027 34.6686 19.7347 37.0285 19.82 37.3087C19.8257 37.3275 19.8362 37.342 19.8535 37.3514C21.0795 38.0243 27.5263 38.4328 27.2529 37.6624L27.6052 38.3435Z" fill="#DDDDDD" />
                    <path fill-rule="evenodd" clip-rule="evenodd" d="M38.75 24C38.75 32.1462 32.1462 38.75 24 38.75C15.8538 38.75 9.25 32.1462 9.25 24C9.25 15.8538 15.8538 9.25 24 9.25C32.1462 9.25 38.75 15.8538 38.75 24ZM20.5608 37.0398C20.1134 35.6496 18.9707 31.9777 17.8859 27.5312C17.8485 27.3776 17.811 27.2246 17.7738 27.0724L17.7728 27.0686C16.411 21.506 15.2986 16.9627 21.3949 15.5354C21.4507 15.5223 21.4779 15.4557 21.441 15.4119C20.7416 14.5821 19.4312 14.3102 17.7744 14.8818C17.7064 14.9052 17.6474 14.8367 17.6896 14.7785C18.0145 14.3307 18.6494 13.9863 18.9629 13.8354C19.0277 13.8042 19.0237 13.7093 18.9551 13.6878C18.7501 13.6237 18.401 13.5254 18.0083 13.4621C17.9154 13.4471 17.907 13.2879 18.0003 13.2753C20.3492 12.9593 22.802 13.6645 24.0329 15.215C24.0445 15.2296 24.0612 15.2398 24.0794 15.2437C28.5867 16.2116 28.9095 23.3367 28.3902 23.6612C28.2879 23.7252 27.9598 23.6885 27.5271 23.6401C25.7733 23.4439 22.3004 23.0553 25.1667 28.3971C25.195 28.4498 25.1575 28.5197 25.0984 28.5289C23.506 28.7764 25.5552 33.7922 27.0719 37.1309C33.0379 35.7407 37.4824 30.3894 37.4824 24C37.4824 16.5539 31.4461 10.5176 24 10.5176C16.5539 10.5176 10.5176 16.5539 10.5176 24C10.5176 30.2575 14.7806 35.5194 20.5608 37.0398Z" fill="white" />
                    <path d="M29.0913 30.703C28.7482 30.544 27.4288 31.4902 26.5532 32.2165C26.3702 31.9575 26.0251 31.7693 25.2467 31.9047C24.5655 32.0231 24.1894 32.1874 24.0216 32.4706C22.9463 32.0629 21.1374 31.4337 20.7003 32.0414C20.2226 32.7056 20.8197 35.8476 21.4542 36.2556C21.7855 36.4686 23.37 35.4501 24.1974 34.7478C24.3309 34.9359 24.5458 35.0435 24.9877 35.0333C25.6559 35.0178 26.7397 34.8623 26.9079 34.5511C26.9181 34.5322 26.9269 34.5098 26.9344 34.4844C27.7849 34.8022 29.2817 35.1386 29.6161 35.0884C30.4875 34.9575 29.4947 30.8899 29.0913 30.703Z" fill="#3CA82B" />
                    <path d="M26.6335 32.3093C26.6696 32.3736 26.6986 32.4415 26.7233 32.5105C26.8445 32.8496 27.042 33.9283 26.8926 34.1947C26.7433 34.4612 25.7731 34.5898 25.1745 34.6002C24.576 34.6105 24.4413 34.3916 24.32 34.0525C24.2231 33.7813 24.1753 33.1435 24.1765 32.7783C24.1519 32.2367 24.3498 32.0462 25.2646 31.8982C25.9415 31.7887 26.2994 31.9161 26.506 32.1341C27.467 31.4168 29.0705 30.4046 29.2269 30.5896C30.0068 31.512 30.1053 33.7079 29.9365 34.5914C29.8813 34.8802 27.2991 34.3052 27.2991 33.9938C27.2991 32.7004 26.9635 32.3456 26.6335 32.3093Z" fill="#4CBA3C" />
                    <path d="M20.9771 31.9054C21.1886 31.5707 22.9036 31.9869 23.8451 32.4059C23.8451 32.4059 23.6516 33.2824 23.9596 34.315C24.0497 34.617 21.7937 35.9614 21.4992 35.7301C21.1589 35.4628 20.5326 32.6089 20.9771 31.9054Z" fill="#4CBA3C" />
                    <path fill-rule="evenodd" clip-rule="evenodd" d="M21.8077 25.1063C21.9465 24.5029 22.5929 23.3659 24.9011 23.3935C26.0681 23.3887 27.5176 23.393 28.4786 23.2839C29.907 23.1216 30.9672 22.7761 31.6737 22.5068C32.6729 22.1256 33.0275 22.2106 33.1518 22.4387C33.2884 22.6893 33.1274 23.1221 32.7783 23.5205C32.1114 24.2814 30.9126 24.8711 28.7952 25.0461C26.6779 25.2211 25.2751 24.6531 24.6713 25.5778C24.4109 25.9766 24.6122 26.9166 26.6598 27.2126C29.4268 27.6119 31.6992 26.7314 31.98 27.2632C32.2608 27.795 30.6434 28.8769 27.8719 28.8996C25.1005 28.9222 23.3694 27.9292 22.7556 27.4356C21.9767 26.8094 21.6282 25.8961 21.8077 25.1063Z" fill="#FFCC33" />
                    <g opacity="0.8">
                        <path d="M25.3372 18.5086C25.4918 18.2554 25.8346 18.0601 26.3956 18.0601C26.9565 18.0601 27.2205 18.2833 27.4032 18.5322C27.4403 18.5829 27.384 18.6425 27.3264 18.6175C27.3125 18.6115 27.2985 18.6054 27.2842 18.5992C27.079 18.5096 26.8271 18.3995 26.3956 18.3934C25.934 18.3868 25.6429 18.5024 25.4597 18.6021C25.3979 18.6356 25.3006 18.5686 25.3372 18.5086Z" fill="#14307E" />
                        <path d="M19.0214 18.8324C19.5661 18.6048 19.9942 18.6342 20.2969 18.7058C20.3606 18.7209 20.4049 18.6523 20.3539 18.6112C20.119 18.4217 19.5933 18.1865 18.9076 18.4422C18.2959 18.6703 18.0076 19.1441 18.0059 19.4557C18.0055 19.5291 18.1565 19.5354 18.1956 19.4732C18.3012 19.3053 18.4767 19.0601 19.0214 18.8324Z" fill="#14307E" />
                        <path fill-rule="evenodd" clip-rule="evenodd" d="M26.8721 21.9714C26.3905 21.9714 25.9999 21.5819 25.9999 21.1024C25.9999 20.623 26.3905 20.2334 26.8721 20.2334C27.3537 20.2334 27.7443 20.623 27.7443 21.1024C27.7443 21.5819 27.3537 21.9714 26.8721 21.9714ZM27.4864 20.8145C27.4864 20.6904 27.3847 20.5898 27.2605 20.5898C27.1364 20.5898 27.0358 20.6904 27.0347 20.8145C27.0347 20.9387 27.1364 21.0393 27.2605 21.0393C27.3858 21.0393 27.4864 20.9387 27.4864 20.8145Z" fill="#14307E" />
                        <path fill-rule="evenodd" clip-rule="evenodd" d="M21.0933 21.7038C21.0933 22.2635 20.6385 22.7173 20.0766 22.7173C19.5159 22.7173 19.06 22.2635 19.06 21.7038C19.06 21.1441 19.5159 20.6904 20.0766 20.6904C20.6374 20.6904 21.0933 21.1441 21.0933 21.7038ZM20.7936 21.3678C20.7936 21.2233 20.6759 21.1056 20.5304 21.1056C20.3859 21.1056 20.2682 21.2223 20.2671 21.3678C20.2671 21.5123 20.3848 21.63 20.5304 21.63C20.6759 21.63 20.7936 21.5123 20.7936 21.3678Z" fill="#14307E" />
                    </g>
                </svg>
            )}
            {name === "PrivacyPro" && (
                <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 48 48" fill="none">
                    <path fill-rule="evenodd" clip-rule="evenodd" d="M27.629 9.23049C26.8 8.34395 25.7498 7.99321 24.4999 8.0001C21.2503 7.99324 21.7126 8.46165 21.0003 9.21477C19.73 10.5579 19.4795 11.283 18.3526 11.661C17.22 12.0408 15.9189 12.7539 14 12.5C11.8615 12.2171 9.02112 11.9033 9.00175 14.2896C8.94035 21.8556 10.4937 28.0976 12.7723 31.6739C15.296 35.6347 17.8011 37.6973 21.2503 39.5324C22.422 40.1559 25.4632 40.1559 26.6348 39.5323C30.084 37.6972 34.2058 35.6346 36.7294 31.6739C39.0081 28.0976 40.0589 23.1568 39.9975 15.5905C39.9781 13.2022 38.0998 11.8892 35.5646 11.8892C35.2955 11.8892 34.3346 11.8361 33.9988 11.8603C33.696 11.8821 33.9083 12.0335 33.6341 12.0349C32.6677 12.0396 31.8684 11.9194 31.1599 11.6889C30.0308 11.3214 28.9118 10.6022 27.629 9.23049Z" fill="#C18010" />
                    <path fill-rule="evenodd" clip-rule="evenodd" d="M25.8311 9.237C24.3178 7.59213 21.6746 7.58847 20.1552 9.22129C18.9056 10.5641 17.8147 11.2891 16.7062 11.6669C15.5921 12.0467 14.2457 12.1488 12.3581 11.895C10.2546 11.6121 8.02155 13.2104 8.0025 15.5962C7.9421 23.1605 8.97575 28.1002 11.2172 31.6756C13.6996 35.6356 17.7541 37.6977 21.147 39.5325C22.2995 40.1559 23.7006 40.1558 24.8532 39.5324C28.246 37.6977 32.3004 35.6356 34.7828 31.6756C37.0243 28.1001 38.0579 23.1603 37.9975 15.5957C37.9784 13.2078 35.742 11.6094 33.6371 11.8951C31.7607 12.1498 30.4182 12.0633 29.3044 11.6949C28.1937 11.3275 27.0929 10.6084 25.8311 9.237Z" fill="#FFCC33" />
                    <path fill-rule="evenodd" clip-rule="evenodd" d="M25.8311 9.237C24.3178 7.59213 21.6746 7.58847 20.1552 9.22129C18.9056 10.5641 17.8147 11.2891 16.7062 11.6669C15.5921 12.0467 14.2457 12.1488 12.3581 11.895C10.2546 11.6121 8.02155 13.2104 8.0025 15.5962C7.9421 23.1605 8.97575 28.1002 11.2172 31.6756C13.6996 35.6356 17.7541 37.6977 21.147 39.5325C22.2995 40.1559 23.7006 40.1558 24.8532 39.5324C28.246 37.6977 32.3004 35.6356 34.7828 31.6756C37.0243 28.1001 38.0579 23.1603 37.9975 15.5957C37.9784 13.2078 35.742 11.6094 33.6371 11.8951C31.7607 12.1498 30.4182 12.0633 29.3044 11.6949C28.1937 11.3275 27.0929 10.6084 25.8311 9.237Z" fill="#FFD65C" />
                    <path fill-rule="evenodd" clip-rule="evenodd" d="M23.063 39.9995C22.4036 40.0101 21.742 39.8544 21.1468 39.5325C20.9942 39.45 20.8403 39.367 20.6853 39.2834C17.3924 37.5084 13.5878 35.4575 11.217 31.6756C8.97559 28.1002 7.94194 23.1605 8.00234 15.5962C8.02138 13.2104 10.2544 11.6121 12.3579 11.895C14.2455 12.1488 15.592 12.0467 16.7061 11.6669C17.8146 11.2891 18.9054 10.5641 20.155 9.22129C20.9125 8.40729 21.9492 8 22.986 8C23.0718 8 23.1576 8.00279 23.2432 8.00836C23.1999 8.24461 22.2612 13.4877 22.2612 23.7377C22.2612 31.3487 22.7787 37.3033 23.063 39.9995Z" fill="#FFDE7A" />
                    <path fill-rule="evenodd" clip-rule="evenodd" d="M22.3363 37.3335L22.3361 37.3334C22.2395 37.2811 22.1429 37.229 22.0465 37.1769C18.6189 35.325 15.3476 33.5576 13.3354 30.3478C11.4696 27.3715 10.4434 23.0044 10.5024 15.6162C10.5054 15.2466 10.6669 14.9331 10.9655 14.6929C11.2889 14.4328 11.6941 14.3282 12.0249 14.3727C14.1505 14.6585 15.9152 14.5779 17.5129 14.0332C19.1172 13.4863 20.5415 12.476 21.9854 10.9244C22.5139 10.3564 23.4662 10.3589 23.9913 10.9297C25.457 12.5228 26.9015 13.5333 28.5193 14.0684C30.1176 14.5971 31.8746 14.6573 33.9733 14.3724C34.3043 14.3275 34.71 14.4318 35.0338 14.6919C35.3329 14.9321 35.4946 15.2458 35.4976 15.6157C35.5566 23.0042 34.5305 27.3714 32.6646 30.3478C30.6524 33.5577 27.3808 35.3252 23.9531 37.1771C23.8569 37.2291 23.7605 37.2812 23.664 37.3333L23.6637 37.3335C23.2533 37.5555 22.7467 37.5555 22.3363 37.3335ZM24.8532 39.5324C23.7006 40.1558 22.2995 40.1559 21.147 39.5325C20.9944 39.45 20.8405 39.367 20.6854 39.2834C17.3926 37.5084 13.588 35.4575 11.2172 31.6756C8.97575 28.1002 7.9421 23.1605 8.0025 15.5962C8.02155 13.2104 10.2546 11.6121 12.3581 11.895C14.2457 12.1488 15.5921 12.0467 16.7062 11.6669C17.8147 11.2891 18.9056 10.5641 20.1552 9.22129C21.6746 7.58847 24.3178 7.59213 25.8311 9.237C27.0929 10.6084 28.1937 11.3275 29.3044 11.6949C30.4182 12.0633 31.7607 12.1498 33.6371 11.8951C35.742 11.6094 37.9784 13.2078 37.9975 15.5957C38.0579 23.1603 37.0243 28.1001 34.7828 31.6756C32.412 35.4577 28.6071 37.5086 25.3142 39.2836C25.1594 39.3671 25.0056 39.45 24.8532 39.5324Z" fill="#E2A412" />
                    <path fill-rule="evenodd" clip-rule="evenodd" d="M23.1069 39.9985C22.4331 40.0169 21.7553 39.8616 21.1469 39.5325C20.9946 39.4501 20.841 39.3673 20.6863 39.2839L20.6854 39.2834C17.3926 37.5084 13.5879 35.4575 11.2171 31.6756C8.9757 28.1002 7.94205 23.1605 8.00245 15.5962C8.0215 13.2104 10.2545 11.6121 12.3581 11.895C14.2456 12.1488 15.5921 12.0467 16.7062 11.6669C17.8147 11.2891 18.9056 10.5641 20.1551 9.22129C20.9126 8.40729 21.9493 8 22.9862 8C23.072 8 23.1579 8.00279 23.2437 8.00838C23.2311 8.09934 23.1185 8.93031 22.9845 10.5C22.6164 10.5003 22.2484 10.6417 21.9853 10.9244C20.5414 12.476 19.1171 13.4863 17.5128 14.0332C15.9152 14.5779 14.1505 14.6585 12.0249 14.3727C11.6941 14.3282 11.2888 14.4328 10.9655 14.6929C10.6668 14.9331 10.5053 15.2466 10.5024 15.6162C10.4434 23.0044 11.4695 27.3715 13.3353 30.3478C15.3475 33.5576 18.6188 35.325 22.0464 37.1769L22.0464 37.1769L22.3361 37.3334L22.3363 37.3335C22.52 37.4329 22.7229 37.4878 22.9279 37.4982C22.9926 38.5066 23.0549 39.3475 23.1069 39.9985Z" fill="#F9BE1A" />
                    <path fill-rule="evenodd" clip-rule="evenodd" d="M30 23.75C30 24.7165 29.2165 25.5 28.25 25.5L17.25 25.5C16.2835 25.5 15.5 24.7165 15.5 23.75C15.5 22.7835 16.2835 22 17.25 22L28.25 22C29.2165 22 30 22.7835 30 23.75Z" fill="#F9BE1A" />
                    <path fill-rule="evenodd" clip-rule="evenodd" d="M22.75 16.5C23.7165 16.5 24.5 17.2835 24.5 18.25V29.25C24.5 30.2165 23.7165 31 22.75 31C21.7835 31 21 30.2165 21 29.25V18.25C21 17.2835 21.7835 16.5 22.75 16.5Z" fill="#F9BE1A" />
                    <path fill-rule="evenodd" clip-rule="evenodd" d="M22.75 16.5C23.7165 16.5 24.5 17.2835 24.5 18.25V22H28.25C29.2165 22 30 22.7835 30 23.75C30 24.7165 29.2165 25.5 28.25 25.5H24.5V29.25C24.5 30.2165 23.7165 31 22.75 31C21.7835 31 21 30.2165 21 29.25V18.25C21 17.2835 21.7835 16.5 22.75 16.5Z" fill="#E2A412" />
                    <path fill-rule="evenodd" clip-rule="evenodd" d="M22.6392 30.9967C21.7243 30.9395 21 30.1794 21 29.2501V25.5001H17.25C16.2836 25.5001 15.5001 24.7166 15.5001 23.7501C15.5001 22.7836 16.2836 22.0001 17.25 22.0001H21V18.2501C21 17.3226 21.7215 16.5637 22.6339 16.5039C22.5543 18.4727 22.4998 20.8048 22.4998 23.5001C22.4998 26.2544 22.5567 28.7811 22.6392 30.9967Z" fill="#F9BE1A" />
                </svg>
            )}
        </>
    )
}