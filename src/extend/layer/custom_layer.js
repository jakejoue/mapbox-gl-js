// @flow
import type { ProgramOptions } from './webgl_wrapper';

import { Program, ProgramConfiguration } from './webgl_wrapper';

type CustomLayerOptions = {
    id: string,
    options: ProgramOptions
}

export default class CustomLayer {
    id: string;
    type: string;
    renderingMode: string;

    map: any;
    matrix: any;

    program: Program;
    configuration: ProgramConfiguration;

    // privite
    _options: CustomLayerOptions;

    constructor(options: CustomLayerOptions) {
        this.id = options.id;

        this._options = options;

        // const
        this.type = 'custom';
        this.renderingMode = '3d';
    }

    onAdd(map: any, gl: WebGLRenderingContext) {
        this.map = map;

        this.program = new Program(gl, this._options.options);
        this.configuration = ProgramConfiguration.createProgramConfiguration(this.program);

        delete this._options;
    }

    render(gl: WebGLRenderingContext, matrix: any) {
        this.matrix = matrix;

        this.program.draw(this, this.configuration);
    }
}
