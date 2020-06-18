// @flow
import CustomLayer from './custom_layer';

// 顶点着色器
const vs = `
precision mediump float;

// 角度
attribute float a_angle;
// 根据角度算出的弧度百分比
attribute float a_opacity;

// 中心点坐标
uniform vec2 u_pos;
// 扇形半径
uniform float u_radius;
// 起始弧度
uniform float u_start_angle;
// 逆时针旋转
uniform bool u_reverse;
uniform mat4 u_matrix;

varying float v_opacity;

vec2 getPoint(const vec2 pos, const float angle, const float radius) {
    float x = sin(angle) * radius;
    float y = cos(angle) * radius;
    return vec2(x + pos.x, pos.y - y);
}

void main() {
    vec2 pos = u_pos;
    if (a_angle != -1.0) {
        // 旋转方向
        float angle = u_start_angle + a_angle;
        // 是否反向旋转
        if (u_reverse) {
            angle = -u_start_angle + a_angle;
        }
        pos = getPoint(u_pos, angle, u_radius);
    }
    gl_Position = u_matrix * vec4(pos, 0.0, 1.0);

    // 非顶点
    if (a_angle != -1.0 && u_reverse) {
        v_opacity = 1.0 - a_opacity;
    } else {
        v_opacity = a_opacity;
    }
}
`;

// 片源着色器
const fs = `
precision mediump float;

uniform vec4 u_color;

varying float v_opacity;

void main() {
    vec4 color = u_color * v_opacity;

    gl_FragColor = color;
}
`;

// 创建指定扇面
function createSector({
    // 边上点的个数
    num = 5,
    // 扇形的弧度
    angle = Math.PI / 6,
}: { num: number, angle: number }) {
    // 顶点个数
    const numVertices = num + 1;
    const numPolygon = num - 1;
    const positions = new Float32Array(numVertices * 2);

    // 起始点，标记为-1
    positions[0] = -1;
    positions[1] = 0.5;
    for (let i = 1; i < numVertices; i++) {
        const index = i * 2;
        positions[index] = (angle / numPolygon) * (i - 1);
        positions[index + 1] = (i - 1) / numPolygon;
    }

    const IndexType =
        numVertices > 0xffff ? Uint32Array : Uint16Array;
    const indices = new IndexType(numPolygon * 3);

    for (let i = 0; i < numPolygon; i++) {
        const index = i * 3;
        indices[index] = 0;
        indices[index + 1] = i + 1;
        indices[index + 2] = i + 2;
    }

    return { POSITION: positions, INDICES: indices };
}

type RadarLayerOptions = {
    id: string,
    position: [number, number],
    radius: number,
    reverse: ?boolean,
    color: ?string,
    num: ?number,
    angle: ?number
}

class RadarLayer extends CustomLayer {
    constructor(options: RadarLayerOptions) {
        const { id, position, radius, reverse = false, color, num, angle } = options;

        if (!(id && position && radius && color)) {
            throw new Error('radarLayer：缺少必备参数');
        }

        const { POSITION, INDICES } = createSector(({ num, angle }: any));
        let startRadius = 0;

        super({
            id,
            programs: {
                vs, fs,
                indices: INDICES,
                attributes: [
                    {
                        members: [
                            { name: "a_angle", type: "Float32", components: 1 },
                            { name: "a_opacity", type: "Float32", components: 1 },
                        ],
                        data: POSITION,
                    },
                ],
                uniforms: [
                    {
                        name: "u_pos", type: "2f", accessor: layer => {
                            const transform = layer.map.projection.getTransform();
                            const x = transform.mercatorXfromLng(position[0]);
                            const y = transform.mercatorYfromLat(position[1]);
                            return [x, y];
                        }
                    },
                    {
                        name: "u_radius", type: "1f", accessor: layer => {
                            const transform = layer.map.projection.getTransform();
                            return transform.mercatorZfromAltitude(radius, position[1]);
                        }
                    },
                    {
                        name: "u_start_angle", type: "1f", accessor: () => {
                            startRadius += 1;
                            return startRadius / 180 * (Math.PI * 2);
                        }
                    },
                    { name: "u_reverse", type: "1i", accessor: +Boolean(reverse) },
                    { name: "u_color", type: "color", accessor: color },
                    { name: "u_matrix", type: "mat4", accessor: layer => layer.matrix }
                ],
            }
        });
    }

    afterRender() {
        this.map.triggerRepaint();
    }
}

export default RadarLayer;
