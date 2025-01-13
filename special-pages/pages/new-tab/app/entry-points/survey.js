import { h } from 'preact';
import { useMessaging, useTypedTranslation } from '../types.js';
import { Centered } from '../components/Layout.js';

export function factory() {
    const ntp = useMessaging();
    const { t } = useTypedTranslation();
    return (
        <Centered>
            <form
                onSubmit={(e) => {
                    e.preventDefault();
                    const data = new FormData(e.currentTarget);
                    const feedback = data.get('feedback');
                    if (feedback) {
                        ntp.messaging.notify('survey_submit', { feedback: feedback.toString() });
                    }
                }}
            >
                <div>
                    <textarea name="feedback" id="feedback"></textarea>
                </div>
                <div>
                    <button>{t('survey_submit_btn')}</button>
                </div>
            </form>
        </Centered>
    );
}
