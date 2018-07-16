'use strict';

import hash from 'hash.js';

import { arrayify } from './bytes';

import { Arrayish } from './types';

export function sha256(data: Arrayish): string {
    return '0x' + (hash.sha256().update(arrayify(data)).digest('hex'));
}

export function sha512(data: Arrayish): string {
    return '0x' + (hash.sha512().update(arrayify(data)).digest('hex'));
}
