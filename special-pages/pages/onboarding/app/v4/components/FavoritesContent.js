import { h } from 'preact';
import { useTypedTranslation } from '../../types';
import { Button } from './Button';
import { Container } from './Container';

/**
 * Bottom bubble content for the favorites step.
 *
 * @param {object} props
 * @param {() => void} props.advance
 */
export function FavoritesContent({ advance }) {
    const { t } = useTypedTranslation();
    return (
        <Container>
            <Button variant="primary" size="stretch" onClick={advance}>
                {t('nextButton')}
            </Button>
        </Container>
    );
}
