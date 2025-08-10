window.wordGraph = {
    initialize,
    highlightNode,
    clearHighlight
};

let simulation, svg, nodeElements, linkElements, labelElements;
const activeNodeColor = "#ffab40"; // 高亮颜色
const defaultNodeColor = "#90caf9"; // 默认颜色

function initialize(words) {
    // 数据处理：从单词列表创建节点和链接
    const graphData = createGraphData(words);
    const { nodes, links } = graphData;

    // SVG 容器设置
    const container = document.getElementById('graph-container');
    if (!container) return;
    const width = container.clientWidth;
    const height = container.clientHeight;

    svg = d3.select("#word-graph")
        .attr("width", width)
        .attr("height", height)
        .attr("viewBox", [-width / 2, -height / 2, width, height]);

    // 清空旧的图谱
    svg.selectAll("*").remove();

    // 力导向模拟
    simulation = d3.forceSimulation(nodes)
        .force("link", d3.forceLink(links).id(d => d.id).distance(60))
        .force("charge", d3.forceManyBody().strength(-150))
        .force("center", d3.forceCenter(0,0));

    // 创建元素
    linkElements = svg.append("g")
        .selectAll("line")
        .data(links)
        .enter().append("line")
        .attr("class", "link");

    nodeElements = svg.append("g")
        .selectAll("circle")
        .data(nodes)
        .enter().append("circle")
        .attr("r", 8)
        .attr("class", "node")
        .attr("fill", defaultNodeColor)
        .call(drag(simulation));

    labelElements = svg.append("g")
        .selectAll("text")
        .data(nodes)
        .enter().append("text")
        .text(d => d.id)
        .attr("class", "label")
        .attr("x", 12)
        .attr("y", 4);

    // 模拟滴答事件
    simulation.on("tick", () => {
        linkElements
            .attr("x1", d => d.source.x)
            .attr("y1", d => d.source.y)
            .attr("x2", d => d.target.x)
            .attr("y2", d => d.target.y);

        nodeElements
            .attr("cx", d => d.x)
            .attr("cy", d => d.y);

        labelElements
            .attr("x", d => d.x + 12)
            .attr("y", d => d.y + 4);
    });

    // 添加缩放支持
    const zoom = d3.zoom().on("zoom", (event) => {
        svg.selectAll('g').attr('transform', event.transform);
    });
    svg.call(zoom);
}

// 根据单词数据生成图谱所需的 nodes 和 links
function createGraphData(words) {
    const nodes = words.map(w => ({ id: w.word, root: w.root }));
    const links = [];
    const rootGroups = {};

    // 按 root 分组
    words.forEach(word => {
        if (!rootGroups[word.root]) {
            rootGroups[word.root] = [];
        }
        rootGroups[word.root].push(word.id || word.word);
    });

    // 创建链接：同一组内的单词互相连接
    for (const root in rootGroups) {
        const group = rootGroups[root];
        for (let i = 0; i < group.length; i++) {
            for (let j = i + 1; j < group.length; j++) {
                links.push({ source: group[i], target: group[j] });
            }
        }
    }
    return { nodes, links };
}

// 拖拽节点的函数
function drag(simulation) {
    function dragstarted(event) {
        if (!event.active) simulation.alphaTarget(0.3).restart();
        event.subject.fx = event.subject.x;
        event.subject.fy = event.subject.y;
    }
    function dragged(event) {
        event.subject.fx = event.x;
        event.subject.fy = event.y;
    }
    function dragended(event) {
        if (!event.active) simulation.alphaTarget(0);
        event.subject.fx = null;
        event.subject.fy = null;
    }
    return d3.drag()
        .on("start", dragstarted)
        .on("drag", dragged)
        .on("end", dragended);
}

// 高亮指定节点
function highlightNode(wordId) {
    clearHighlight();
    nodeElements.filter(d => d.id === wordId)
        .attr("fill", activeNodeColor)
        .attr("r", 12); // 放大高亮节点
}

// 清除所有高亮
function clearHighlight() {
     nodeElements.attr("fill", defaultNodeColor).attr("r", 8);
}