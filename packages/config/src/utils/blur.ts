export default (token = '', chars = 5) => `${token.slice(0, chars)}...${token.slice(-chars)}`;
