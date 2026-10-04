export const element = (tag, properties, ...children) => {
  const node = Object.assign(document.createElement(tag), properties)
  node.append(...children)
  return node
}
