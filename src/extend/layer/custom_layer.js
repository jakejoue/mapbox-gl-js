// @flow
import type { ProgramOptions } from './webgl_wrapper';

import { Program, ProgramConfiguration } from './webgl_wrapper';

type CustomLayerOptions = {
    id: string,
    programs: ProgramOptions | Array<ProgramOptions>
}

export default class CustomLayer {
    id: string;
    type: string;
    renderingMode: string;

    map: any;
    matrix: any;

    programs: Array<Program>;
    configurations: Array<ProgramConfiguration>;

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

        // 归化为数组
        let programs = this._options.programs;
        if (!(programs instanceof Array)) {
            programs = [programs];
        }

        this.programs = programs.map(program => new Program(gl, program));
        this.configurations = this.programs.map(program => ProgramConfiguration.createProgramConfiguration(program));

        delete this._options;
    }

    onRemove() {
        for (let i = 0; i < this.programs.length; i++) {
            const program = this.programs[i];
            const configuration = this.configurations[i];

            configuration.destroy();
            program.destroy();
        }
        delete this.map;
        delete this.matrix;
        delete this.programs;
        delete this.configurations;
    }

    render(gl: WebGLRenderingContext, matrix: any) {
        this.matrix = matrix;

        for (let i = 0; i < this.programs.length; i++) {
            const program = this.programs[i];
            const configuration = this.configurations[i];

            // 激活当前program
            program.active();

            // 绘制前处理
            if (this.beforeRender) {
                this.beforeRender(program, configuration);
            }

            // 绘制数据
            program.draw(this, configuration);

            // 绘制后处理
            if (this.afterRender) {
                this.afterRender(program, configuration);
            }
        }
    }

    +beforeRender: (program: Program, configuration: ProgramConfiguration) => void;
    +afterRender: (program: Program, configuration: ProgramConfiguration) => void;
}
