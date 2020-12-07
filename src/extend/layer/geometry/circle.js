// @flow

function circle({radius = 1, segments = 3, thetaStart = 0, thetaLength = Math.PI / 6}: any) {
    segments = segments !== undefined ? Math.max(3, segments) : 8;

    // buffers
    const indices = [];
    const vertices = [];
    const normals = [];
    const uvs = [];

    // helper variables
    let i, s;

    // center point
    vertices.push(0, 0, 0);
    normals.push(0, 0, 0);
    uvs.push(0.5, 0.5);

    for (s = 0, i = 3; s <= segments; s++, i += 3) {
        const segment = thetaStart + s / segments * thetaLength;
        // vertex
        const x = radius * Math.cos(segment);
        const y = radius * Math.sin(segment);
        vertices.push(x, y, 0);

        // normal
        normals.push(Math.cos(segment), Math.sin(segment), 0);

        // uvs
        const uvX = (vertices[i] / radius + 1) / 2;
        const uvY = (vertices[i + 1] / radius + 1) / 2;
        uvs.push(uvX, uvY);
    }

    // indices
    for (i = 1; i <= segments; i++) {
        indices.push(i, i + 1, 0);
    }

    return {
        indices: {size: 1, value: indices},
        attributes: {
            POSITION: {size: 3, value: new Float32Array(vertices)},
            NORMAL: {size: 3, value: new Float32Array(normals)},
            TEXCOORD_0: {size: 2, value: new Uint32Array(indices)}
        }
    };
}

export default circle;
