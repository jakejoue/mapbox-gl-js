// @flow
import window from '../../util/window';

import CustomLayer from './custom_layer';

import { mat4 } from 'gl-matrix';

// 顶点着色器
const vs = `
precision mediump float;

attribute vec2 a_pos;

varying vec2 v_pos;
varying vec2 v_uv;

// 对象转换方式
uniform mat4 u_matrix;
uniform mat4 u_obj_matrix;
uniform mat4 u_rotate_matrix;

void main() {
    gl_Position = u_matrix * u_obj_matrix * u_rotate_matrix * vec4(a_pos, 0.0, 1.0);

    v_pos = a_pos;
    v_uv = a_pos * 0.5 + vec2(0.5, 0.5);
}
`;

// 片源着色器
const fs = `
precision mediump float;

varying vec2 v_pos;
varying vec2 v_uv;

uniform sampler2D u_sampler;
uniform vec4 u_color;

void main() {
    if (length(v_pos) > 1.0) {
        discard;
    }

    vec4 color = texture2D(u_sampler, v_uv);
    gl_FragColor = color * u_color;
}
`;

type ImageCircleOptions = {
    id: string,
    position: [number, number],
    radius: number,
    url: string,
    color: ?string,
    reverse: ?boolean
}

class ImageCircle extends CustomLayer {
    imageLoaded: boolean;

    constructor(options: ImageCircleOptions) {
        const { id, position, radius, url, color = "white", reverse = false } = options;

        if (!(id && position && radius && url)) {
            throw new Error('ImageCircle：缺少必备参数');
        }

        // 加载贴图图片
        const image = new window.Image();
        image.onload = () => {
            this.imageLoaded = true;
        };
        image.src = url;

        // 定义需要用到的变换矩阵
        let objm = null;
        let timer = 0;

        super({
            id,
            programs: {
                vs, fs,
                // 两个三角形顶点
                indices: new Uint16Array([
                    0, 2, 1,
                    1, 2, 3
                ]),
                attributes: [
                    {
                        members: [
                            { name: "a_pos", type: "Float32", components: 2 },
                        ],
                        // ┌──────┐
                        // │ 0  1 │ Counter-clockwise winding order.
                        // │      │ Triangle 1: 0 => 2 => 1
                        // │ 2  3 │ Triangle 2: 1 => 2 => 3
                        // └──────┘
                        data: new Float32Array([
                            -1, 1, 1, 1,
                            -1, -1, 1, -1
                        ]),
                    },
                ],
                uniforms: [
                    { name: "u_color", type: "color", accessor: color },
                    { name: "u_sampler", type: "image", accessor: image },
                    {
                        name: "u_obj_matrix", type: "mat4", accessor: layer => {
                            if (!objm) {
                                const transform = layer.map.projection.getTransform();
                                const x = transform.mercatorXfromLng(position[0]);
                                const y = transform.mercatorYfromLat(position[1]);
                                const scale = transform.mercatorZfromAltitude(radius, position[1]);

                                const m = mat4.create();
                                // 平移
                                mat4.translate(m, m, [x, y, 0]);

                                // 缩放
                                mat4.scale(m, m, [scale, -scale, 1]);

                                objm = m;
                            }

                            return objm;
                        }
                    },
                    {
                        name: "u_rotate_matrix", type: "mat4", accessor: () => {
                            const m = mat4.create();

                            timer += reverse ? 1 : -1;
                            mat4.rotateZ(m, m, timer / 180 * Math.PI);

                            return m;
                        }
                    },
                    { name: "u_matrix", type: "mat4", accessor: layer => layer.matrix }
                ],
            }
        });

    }

    render(gl: WebGLRenderingContext, matrix: any) {
        if (this.imageLoaded) {
            super.render(gl, matrix);
        }
    }

    afterRender() {
        this.map.triggerRepaint();
    }
}

export default ImageCircle;
