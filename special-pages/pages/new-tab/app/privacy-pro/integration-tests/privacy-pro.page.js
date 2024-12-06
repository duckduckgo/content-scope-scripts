// import { data } from '../mocks/stats.js';
// import { expect } from '@playwright/test';

// export class PrivacyProPage {
//     /**
//      * @param {import("@playwright/test").Page} page
//      * @param {import("../../../integration-tests/new-tab.page.js").NewtabPage} ntp
//      */
//     constructor(page, ntp) {
//         this.page = page;
//         this.ntp = ntp;
//     }

//     /**
//      * @param {object} params
//      * @param {number} params.count
//      */
//     async receive({ count }) {
//         /** @type {import("../../../types/new-tab.js").PrivacyProData} */
//         const next = data.basic;
//         await this.ntp.mocks.simulateSubscriptionMessage('privacyPro_onDataUpdate', next);
//     }

//     /**
//      * @param {import("../../../types/new-tab.js").PrivacyProData} data
//      */
//     async receiveData(data) {
//         await this.ntp.mocks.simulateSubscriptionMessage('privacyPro_onDataUpdate', data);
//     }

//     context() {
//         return this.page.locator('[data-entry-point="privacyPro"]');
//     }

//     rows() {
//         return this.context().getByTestId('CompanyList').locator('li');
//     }

//     /**
//      * @param {number} count
//      */
//     async hasRows(count) {
//         const rows = this.rows();
//         expect(await rows.count()).toBe(count);
//     }

//     async showMoreSecondary() {
//         await this.context().getByLabel('Show More', { exact: true }).click();
//     }

//     async showLessSecondary() {
//         await this.context().getByLabel('Show Less', { exact: true }).click();
//     }
// }
