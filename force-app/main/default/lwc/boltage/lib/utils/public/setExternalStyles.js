/**
 * Will plug your styles to an html element that has the attribute [data-style] on it
 * @param {string} styles
 */
export function setExternalStyles(styles) {
  this.refs?.style.insertAdjacentHTML('beforeend',`<style>${styles}</style>`)
}