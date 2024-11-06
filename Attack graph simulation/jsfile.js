
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

const state = {
    nodes: [],
    connections: [],
    packets: [],
    isDragging: false,
    selectedNode: null,
    isDrawingArrow: false,
    startNode: null,
    mouseX: 0,
    mouseY: 0,
    isAttacking: false
};

function resizeCanvas() {
    canvas.width = canvas.parentElement.clientWidth;
    canvas.height = window.innerHeight;
}

class Node {
    constructor(type, x, y) {
        this.type = type;
        this.x = x;
        this.y = y;
        this.width = 100;
        this.height = 50;
        this.color = '#fff';
    }

    isPointInside(x, y) {
        return x >= this.x && x <= this.x + this.width &&
               y >= this.y && y <= this.y + this.height;
    }

    draw() {
        ctx.fillStyle = this.color;
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.rect(this.x, this.y, this.width, this.height);
        ctx.fill();
        ctx.stroke();
        
        ctx.fillStyle = '#000';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(this.type, this.x + this.width/2, this.y + this.height/2);
    }
}

function drawArrow(fromX, fromY, toX, toY, color = '#999') {
    const headLength = 15;
    const angle = Math.atan2(toY - fromY, toX - fromX);
    const midX = (fromX + toX) / 2;
    const midY = (fromY + toY) / 2;
    
    ctx.beginPath();
    ctx.moveTo(fromX, fromY);
    ctx.lineTo(toX, toY);
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(midX, midY);
    ctx.lineTo(midX - headLength * Math.cos(angle - Math.PI/6),
               midY - headLength * Math.sin(angle - Math.PI/6));
    ctx.lineTo(midX - headLength * Math.cos(angle + Math.PI/6),
               midY - headLength * Math.sin(angle + Math.PI/6));
    ctx.closePath();
    ctx.fillStyle = color;
    ctx.fill();
}


function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    state.connections.forEach(conn => {
        drawArrow(
            conn.start.x + conn.start.width/2,
            conn.start.y + conn.start.height/2,
            conn.end.x + conn.end.width/2,
            conn.end.y + conn.end.height/2
        );
    });
    
    state.nodes.forEach(node => node.draw());
    
    if (state.isDrawingArrow && state.startNode) {
        drawArrow(
            state.startNode.x + state.startNode.width/2,
            state.startNode.y + state.startNode.height/2,
            state.mouseX,
            state.mouseY
        );
    }
}


function startAttack() {
    console.log("Attack started!");
    state.isAttacking = true;
    const attackerNode = state.nodes.find(node => node.type === 'attacker');
    if (attackerNode) {
        attackerNode.color = '#ff0000';
        colorConnectionsSequentially();
    }
}

function colorConnectionsSequentially() {
    let currentNode = state.nodes.find(node => node.type === 'attacker');
    let delay = 0;
    
    while (currentNode && currentNode.type !== 'database') {
        const nextConnection = state.connections.find(conn => conn.start === currentNode);
        if (nextConnection) {
            setTimeout(() => {
                nextConnection.color = '#ff0000';
                nextConnection.end.color = '#ff0000';
                draw();
            }, delay);
            currentNode = nextConnection.end;
            delay += 1000; // 1second between kel connection
        } else {
            break;
        }
    }
}


function findNodeAtPosition(x, y) {
    return state.nodes.find(node => node.isPointInside(x, y));
}

function connectionExists(start, end) {
    return state.connections.some(conn => conn.start === start && conn.end === end);
}

document.querySelectorAll('.node-item, .arrow-item').forEach(item => {
    item.addEventListener('dragstart', e => {
        e.dataTransfer.setData('type', item.dataset.type);
    });
});

canvas.addEventListener('dragover', e => e.preventDefault());

canvas.addEventListener('drop', e => {
    const type = e.dataTransfer.getData('type');
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    if (type === 'arrow') {
        state.isDrawingArrow = true;
        state.startNode = findNodeAtPosition(x, y);
        if (state.startNode) {
            state.mouseX = x;
            state.mouseY = y;
        }
    } else {
        state.nodes.push(new Node(type, x, y));
    }
    draw();
});

canvas.addEventListener('mousedown', e => {
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const clickedNode = findNodeAtPosition(x, y);

    if (clickedNode) {
        if (state.isDrawingArrow && state.startNode) {
            if (clickedNode !== state.startNode && !connectionExists(state.startNode, clickedNode)) {
                state.connections.push({
                    start: state.startNode,
                    end: clickedNode,
                    direction: 'forward'
                });
                state.isDrawingArrow = false;
                state.startNode = null;
            }
        } else if (state.isDrawingArrow) {
            state.startNode = clickedNode;
            state.mouseX = x;
            state.mouseY = y;
        } else {
            state.isDragging = true;
            state.selectedNode = clickedNode;
        }
    }
    draw();
});

canvas.addEventListener('mousemove', e => {
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (state.isDragging && state.selectedNode) {
        state.selectedNode.x = x - state.selectedNode.width/2;
        state.selectedNode.y = y - state.selectedNode.height/2;
    }
    
    if (state.isDrawingArrow) {
        state.mouseX = x;
        state.mouseY = y;
    }
    
    draw();
});

canvas.addEventListener('mouseup', () => {
    state.isDragging = false;
    state.selectedNode = null;
    draw();
});

resizeCanvas();
window.addEventListener('resize', resizeCanvas);
draw();