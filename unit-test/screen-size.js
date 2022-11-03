import { correctWindowOpenOffset } from '../src/features/fingerprinting-screen-size.js'

describe('WindowOpenOffsetParser', () => {
    it('top, left simple offset corrections', () => {
        const windowFeatures = 'left=500,top=500,height=500,width=500'
        expect(
            correctWindowOpenOffset(windowFeatures, 'top', 100)
        ).toEqual(
            'left=500,top=600,height=500,width=500'
        )
        expect(
            correctWindowOpenOffset(windowFeatures, 'left', 100)
        ).toEqual(
            'left=600,top=500,height=500,width=500'
        )
        expect(
            correctWindowOpenOffset(windowFeatures, 'top', -100)
        ).toEqual(
            'left=500,top=400,height=500,width=500'
        )
        expect(
            correctWindowOpenOffset(windowFeatures, 'left', -100)
        ).toEqual(
            'left=400,top=500,height=500,width=500'
        )
    })
    it('screenX, screenY simple offset corrections', () => {
        const windowFeatures = 'screenX=500,screenY=500,height=500,width=500'
        expect(
            correctWindowOpenOffset(windowFeatures, 'screenY', 100)
        ).toEqual(
            'screenX=500,screenY=600,height=500,width=500'
        )
        expect(
            correctWindowOpenOffset(windowFeatures, 'screenX', 100)
        ).toEqual(
            'screenX=600,screenY=500,height=500,width=500'
        )
        expect(
            correctWindowOpenOffset(windowFeatures, 'screenY', -100)
        ).toEqual(
            'screenX=500,screenY=400,height=500,width=500'
        )
        expect(
            correctWindowOpenOffset(windowFeatures, 'screenX', -100)
        ).toEqual(
            'screenX=400,screenY=500,height=500,width=500'
        )
    })
    it('Negative offsets provided', () => {
        const windowFeatures = 'left=-500,top=-500'
        expect(
            correctWindowOpenOffset(windowFeatures, 'top', 100)
        ).toEqual(
            'left=-500,top=-400'
        )
        expect(
            correctWindowOpenOffset(windowFeatures, 'left', 100)
        ).toEqual(
            'left=-400,top=-500'
        )
        expect(
            correctWindowOpenOffset(windowFeatures, 'top', -100)
        ).toEqual(
            'left=-500,top=-600'
        )
        expect(
            correctWindowOpenOffset(windowFeatures, 'left', -100)
        ).toEqual(
            'left=-600,top=-500'
        )
    })
    it('check case insensitivity', () => {
        const windowFeatures = 'LeFT=500,Top=500'
        expect(
            correctWindowOpenOffset(windowFeatures, 'top', 100)
        ).toEqual(
            'LeFT=500,top=600'
        )
        expect(
            correctWindowOpenOffset(windowFeatures, 'left', 100)
        ).toEqual(
            'left=600,Top=500'
        )
    })
    it('check spacing', () => {
        const windowFeatures = '    screenX=      500,      screenY   =    500'
        expect(
            correctWindowOpenOffset(windowFeatures, 'screenX', 100)
        ).toEqual(
            '    screenX=600,      screenY   =    500'
        )
        expect(
            correctWindowOpenOffset(windowFeatures, 'screenY', 100)
        ).toEqual(
            '    screenX=      500,      screenY=600'
        )
    })
    it('check all four', () => {
        const windowFeatures = 'screenX=0,screenY=0,top=0,left=0'
        expect(
            correctWindowOpenOffset(windowFeatures, 'screenX', 100)
        ).toEqual(
            'screenX=100,screenY=0,top=0,left=0'
        )
        expect(
            correctWindowOpenOffset(windowFeatures, 'screenY', 100)
        ).toEqual(
            'screenX=0,screenY=100,top=0,left=0'
        )
        expect(
            correctWindowOpenOffset(windowFeatures, 'left', 100)
        ).toEqual(
            'screenX=0,screenY=0,top=0,left=100'
        )
        expect(
            correctWindowOpenOffset(windowFeatures, 'top', 100)
        ).toEqual(
            'screenX=0,screenY=0,top=100,left=0'
        )
    })
    it('incomplete inital string', () => {
        const windowFeatures = 'screenX=.,screenY,top=-,left='
        expect(
            correctWindowOpenOffset(windowFeatures, 'screenX', 100)
        ).toEqual(
            'screenX=.,screenY,top=-,left='
        )
        expect(
            correctWindowOpenOffset(windowFeatures, 'screenY', 100)
        ).toEqual(
            'screenX=.,screenY,top=-,left='
        )
        expect(
            correctWindowOpenOffset(windowFeatures, 'left', 100)
        ).toEqual(
            'screenX=.,screenY,top=-,left='
        )
        expect(
            correctWindowOpenOffset(windowFeatures, 'top', 100)
        ).toEqual(
            'screenX=.,screenY,top=-,left='
        )
    })
    it('token substrings', () => {
        const windowFeatures = 'stop=100,bleft=100'
        expect(
            correctWindowOpenOffset(windowFeatures, 'top', 100)
        ).toEqual(
            'stop=100,bleft=100'
        )
        expect(
            correctWindowOpenOffset(windowFeatures, 'left', 100)
        ).toEqual(
            'stop=100,bleft=100'
        )
    })
    it('empty string input', () => {
        const windowFeatures = ''
        expect(
            correctWindowOpenOffset(windowFeatures, 'top', 100)
        ).toEqual(
            ''
        )
        expect(
            correctWindowOpenOffset(windowFeatures, 'left', 100)
        ).toEqual(
            ''
        )
    })
    it('input that doesnt contain any matches', () => {
        const windowFeatures = 'height=500, width=500'
        expect(
            correctWindowOpenOffset(windowFeatures, 'top', 100)
        ).toEqual(
            'height=500, width=500'
        )
        expect(
            correctWindowOpenOffset(windowFeatures, 'left', 100)
        ).toEqual(
            'height=500, width=500'
        )
    })
    it('decimal points', () => {
        const windowFeatures = 'screenX=123.453,screenY=300.0'
        expect(
            correctWindowOpenOffset(windowFeatures, 'screenX', 100)
        ).toEqual(
            'screenX=223.453,screenY=300.0'
        )
        expect(
            correctWindowOpenOffset(windowFeatures, 'screenY', 100)
        ).toEqual(
            'screenX=123.453,screenY=400'
        )
    })
    it('too many decimal points', () => {
        const windowFeatures = 'screenX=1.2.3,screenY=3.....'
        expect(
            correctWindowOpenOffset(windowFeatures, 'screenX', 100)
        ).toEqual(
            'screenX=101.2.3,screenY=3.....'
        )
        expect(
            correctWindowOpenOffset(windowFeatures, 'screenY', 100)
        ).toEqual(
            'screenX=1.2.3,screenY=103.....'
        )
    })
    it('singletons', () => {
        expect(
            correctWindowOpenOffset('screenX=100', 'screenX', 100)
        ).toEqual(
            'screenX=200'
        )
        expect(
            correctWindowOpenOffset('screenY=100', 'screenY', 100)
        ).toEqual(
            'screenY=200'
        )
    })
})
