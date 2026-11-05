import type {Fragment, Node as ProseMirrorNode, Slice} from '@tiptap/pm/model'

const LIST_TYPES = ['bulletList', 'orderedList', 'taskList']

/**
 * Plain text for a copy from the editor. ProseMirror's default only joins the text of
 * the blocks, which drops the list markers and leaves a copied list looking like loose
 * paragraphs. Here list items keep their markers, everything else is the text as-is.
 */
export function sliceToClipboardText(slice: Slice): string {
	return joinBlocks(slice.content, '\n\n')
}

function joinBlocks(fragment: Fragment, separator: string): string {
	const parts: string[] = []
	fragment.forEach(child => {
		const text = blockText(child)
		if (text !== '') {
			parts.push(text)
		}
	})
	return parts.join(separator)
}

function blockText(node: ProseMirrorNode): string {
	if (LIST_TYPES.includes(node.type.name)) {
		return listText(node)
	}
	if (node.isTextblock) {
		return node.textContent
	}
	if (node.isLeaf) {
		return ''
	}
	return joinBlocks(node.content, '\n\n')
}

function listText(list: ProseMirrorNode): string {
	const lines: string[] = []
	let number = 0

	list.forEach(item => {
		number++
		const marker = listMarker(list.type.name, item, number)
		// Continuation lines (nested lists, extra paragraphs) sit under the item's text.
		const body = joinBlocks(item.content, '\n').replaceAll('\n', '\n  ')
		lines.push(marker + body)
	})

	return lines.join('\n')
}

function listMarker(listType: string, item: ProseMirrorNode, number: number): string {
	switch (listType) {
		case 'orderedList':
			return `${number}. `
		case 'taskList':
			return `- [${item.attrs.checked ? 'x' : ' '}] `
		default:
			return '- '
	}
}
