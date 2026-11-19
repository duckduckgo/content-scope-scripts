import { equal } from 'node:assert/strict';
import { test } from 'node:test';
import { formatRenderer } from '../utils/device-details.js';

test('formatRenderer tidies ANGLE renderer strings', () => {
    equal(formatRenderer('ANGLE (Apple, ANGLE Metal Renderer: Apple M2, Unspecified Version)'), 'Apple M2 · ANGLE (Metal)');
    equal(
        formatRenderer('ANGLE (NVIDIA, NVIDIA GeForce RTX 3060 (0x00002504) Direct3D11 vs_5_0 ps_5_0, D3D11)'),
        'NVIDIA GeForce RTX 3060 · ANGLE (Direct3D 11)',
    );
    equal(
        formatRenderer('ANGLE (Intel, Intel(R) UHD Graphics 620 (0x00005917) Direct3D11 vs_5_0 ps_5_0, D3D11)'),
        'Intel(R) UHD Graphics 620 · ANGLE (Direct3D 11)',
    );
});

test('formatRenderer leaves other renderer strings alone', () => {
    equal(formatRenderer('Apple GPU'), 'Apple GPU');
    equal(formatRenderer('  Mesa Intel(R) Xe Graphics  '), 'Mesa Intel(R) Xe Graphics');
});
