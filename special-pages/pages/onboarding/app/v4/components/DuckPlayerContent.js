import { h } from 'preact';
import { useContext } from 'preact/hooks';
import { GlobalDispatch } from '../../global';
import { useTypedTranslation } from '../../types';
import { Button } from './Button';
import styles from './DuckPlayerContent.module.css';

/**
 * Bottom bubble content for the duckPlayerSingle step.
 * Shows the Duck Player promo image and a Next button.
 */
export function DuckPlayerContent() {
    const { t } = useTypedTranslation();
    const dispatch = useContext(GlobalDispatch);

    const advance = () => dispatch({ kind: 'advance' });

    return (
        <div class={styles.root}>
            <div class={styles.imageContainer}>
                <img src="assets/img/v4/duck-player-promo.svg" alt="" class={styles.promoImage} />
            </div>
            <Button variant="primary" onClick={advance} class={styles.nextButton}>
                {t('nextButton')}
            </Button>
        </div>
    );
}
