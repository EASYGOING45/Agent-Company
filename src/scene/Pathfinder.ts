/**
 * 鸣潮元宇宙 - A* 寻路算法
 * 基于 Miniverse Pathfinder
 */

interface Node {
  x: number;
  y: number;
  g: number;
  h: number;
  f: number;
  parent?: Node;
}

export class Pathfinder {
  private grid: boolean[][];
  private rows: number;
  private cols: number;

  constructor(walkable: boolean[][]) {
    this.grid = walkable;
    this.rows = walkable.length;
    this.cols = walkable[0]?.length || 0;
  }

  /**
   * A* 寻路
   */
  findPath(startX: number, startY: number, endX: number, endY: number): { x: number; y: number }[] {
    // 边界检查
    if (!this.isValid(startX, startY) || !this.isValid(endX, endY)) {
      return [];
    }

    // 起点终点相同
    if (startX === endX && startY === endY) {
      return [{ x: startX, y: startY }];
    }

    const openList: Node[] = [];
    const closedList = new Set<string>();

    const startNode: Node = {
      x: startX,
      y: startY,
      g: 0,
      h: this.heuristic(startX, startY, endX, endY),
      f: 0,
    };
    startNode.f = startNode.g + startNode.h;
    openList.push(startNode);

    while (openList.length > 0) {
      // 找到 f 值最小的节点
      let currentIdx = 0;
      for (let i = 1; i < openList.length; i++) {
        if (openList[i].f < openList[currentIdx].f) {
          currentIdx = i;
        }
      }

      const current = openList[currentIdx];

      // 到达终点
      if (current.x === endX && current.y === endY) {
        return this.reconstructPath(current);
      }

      openList.splice(currentIdx, 1);
      closedList.add(`${current.x},${current.y}`);

      // 检查邻居
      const neighbors = this.getNeighbors(current.x, current.y);
      for (const neighbor of neighbors) {
        const key = `${neighbor.x},${neighbor.y}`;
        if (closedList.has(key)) continue;

        const g = current.g + 1;
        const h = this.heuristic(neighbor.x, neighbor.y, endX, endY);
        const f = g + h;

        const existingIdx = openList.findIndex(n => n.x === neighbor.x && n.y === neighbor.y);
        if (existingIdx === -1) {
          openList.push({
            x: neighbor.x,
            y: neighbor.y,
            g,
            h,
            f,
            parent: current,
          });
        } else if (g < openList[existingIdx].g) {
          openList[existingIdx].g = g;
          openList[existingIdx].f = f;
          openList[existingIdx].parent = current;
        }
      }
    }

    // 无路径
    return [];
  }

  /**
   * 获取可行走的瓦片列表
   */
  getWalkableTiles(): { x: number; y: number }[] {
    const tiles: { x: number; y: number }[] = [];
    for (let y = 0; y < this.rows; y++) {
      for (let x = 0; x < this.cols; x++) {
        if (this.grid[y][x]) {
          tiles.push({ x, y });
        }
      }
    }
    return tiles;
  }

  private isValid(x: number, y: number): boolean {
    return x >= 0 && x < this.cols && y >= 0 && y < this.rows && this.grid[y][x];
  }

  private heuristic(x1: number, y1: number, x2: number, y2: number): number {
    // 曼哈顿距离
    return Math.abs(x1 - x2) + Math.abs(y1 - y2);
  }

  private getNeighbors(x: number, y: number): { x: number; y: number }[] {
    const dirs = [[0, -1], [0, 1], [-1, 0], [1, 0]]; // 上下左右
    const neighbors: { x: number; y: number }[] = [];

    for (const [dx, dy] of dirs) {
      const nx = x + dx;
      const ny = y + dy;
      if (this.isValid(nx, ny)) {
        neighbors.push({ x: nx, y: ny });
      }
    }

    return neighbors;
  }

  private reconstructPath(endNode: Node): { x: number; y: number }[] {
    const path: { x: number; y: number }[] = [];
    let current: Node | undefined = endNode;

    while (current) {
      path.unshift({ x: current.x, y: current.y });
      current = current.parent;
    }

    return path;
  }
}
