<template>
	<div ref="wrapRef" :class="getWrapperClass">
		<BasicForm ref="formRef" submitOnReset v-bind="getFormProps" v-if="getBindValues.useSearchForm" :tableAction="tableAction" @register="registerForm" @submit="handleSearchInfoChange" @advanced-change="redoHeight">
			<template #[replaceFormSlotKey(item)]="data" v-for="item in getFormSlotKeys">
				<slot :name="item" v-bind="data || {}"></slot>
			</template>
		</BasicForm>

		<div :class="`${prefixCls}__table-wrapper`" v-show="getEmptyDataIsShowTable">
			<div :class="`${prefixCls}__header`" v-if="getHeaderRender">
				<RenderNode :render="getHeaderRender" />
			</div>
			<ElTable
				ref="tableElRef"
				v-loading="getLoading"
				:data="getElementDataSource"
				:border="getBindValues.bordered"
				:stripe="getBindValues.striped"
				:row-key="getElementRowKey"
				:row-class-name="getElementRowClassName"
				:height="getElementTableHeight"
				:tree-props="getElementTreeProps"
				:default-expand-all="getBindValues.defaultExpandAllRows"
				:expand-row-keys="getElementExpandedRowKeys"
				:expand-on-click-row="!!getBindValues.expandRowByClick"
				style="width: 100%"
				@selection-change="handleElementSelectionChange"
				@row-click="handleElementRowClick"
				@row-dblclick="handleElementRowDbClick"
				@row-contextmenu="handleElementRowContextmenu"
				@sort-change="handleElementSortChange"
				@expand-change="handleElementExpandChange"
			>
				<ElTableColumn v-if="getRowSelectionRef" type="selection" width="60" align="center" reserve-selection :fixed="getElementSelectionFixed" :selectable="getElementSelectable" />
				<ElementTableColumn v-for="column in getElementColumns" :key="getElementColumnKey(column)" :column="column" :render-header="renderElementHeader" :render-cell="renderElementCell" />
			</ElTable>
			<ElPagination
				v-if="getElementPagination"
				:class="`${prefixCls}__pagination`"
				:current-page="getElementPagination.current"
				:page-size="getElementPagination.pageSize"
				:page-sizes="getElementPagination.pageSizes"
				:total="getElementPagination.total"
				:layout="getElementPagination.layout"
				:small="getElementPagination.small"
				:disabled="getElementPagination.disabled"
				background
				@current-change="handleElementCurrentChange"
				@size-change="handleElementSizeChange"
			/>
		</div>
	</div>
</template>

<script setup>
// import type { BasicTableProps, ColumnChangeParam, SizeType, TableActionType } from './types/table'
// import { InnerHandlers, InnerMethods } from './types/table'
import { computed, defineComponent, h, inject, nextTick, onMounted, ref, toRaw, unref, useAttrs, useSlots, watch } from 'vue'
import { ElPagination, ElTable, ElTableColumn } from 'element-plus'
import { BasicForm, useForm } from '@/components/Form'
import { PageWrapperFixedHeightKey } from '@/enums'
import HeaderCell from './components/HeaderCell.vue'
import { usePagination } from './hooks/usePagination'
import { useColumns } from './hooks/useColumns'
import { useDataSource } from './hooks/useDataSource'
import { useLoading } from './hooks/useLoading'
import { useRowSelection } from './hooks/useRowSelection'
import { useTableScroll } from './hooks/useTableScroll'
import { useTableScrollTo } from './hooks/useScrollTo'
import { useCustomRow } from './hooks/useCustomRow'
import { useTableStyle } from './hooks/useTableStyle'
import { useTableHeader } from './hooks/useTableHeader'
import { useTableExpand } from './hooks/useTableExpand'
import { createTableContext } from './hooks/useTableContext'
import { useTableFooter } from './hooks/useTableFooter'
import { useTableForm } from './hooks/useTableForm'
import { useDesign } from '@/hooks/web/useDesign'
import { debounce, get, omit } from 'lodash-es'
import { useElementSize } from '@vueuse/core'
import { basicProps } from './props'
import { isBoolean, isFunction } from '@/utils/core/ObjectUtil'
import { PAGE_SIZE, ROW_KEY } from './const'

defineOptions({ name: 'BasicTable' })

// Element 的 height 包含表头，原封装里的 scroll.y 只表示 body 高度，这里用默认值兜底，实际高度挂载后从 DOM 读取。
const DEFAULT_ELEMENT_TABLE_HEADER_HEIGHT = 55

// 保留原 BasicTable 表头工具栏的 render 结果，避免切 Element 表格时影响新增/删除/导出等按钮区域。
const RenderNode = defineComponent({
	name: 'BasicTableRenderNode',
	props: {
		render: {
			type: Function,
			default: null,
		},
	},
	setup(props) {
		return () => props.render?.()
	},
})

// 将原来 Ant Design Vue 风格的 columns 递归转换成 Element Plus 的 ElTableColumn。
const ElementTableColumn = defineComponent({
	name: 'BasicElementTableColumn',
	props: {
		column: {
			type: Object,
			required: true,
		},
		renderHeader: {
			type: Function,
			required: true,
		},
		renderCell: {
			type: Function,
			required: true,
		},
	},
	setup(props) {
		return () => {
			const column = props.column || {}
			const children = column.children?.length
				? {
						default: () => column.children.map((child) => h(ElementTableColumn, { column: child, renderHeader: props.renderHeader, renderCell: props.renderCell, key: getElementColumnKey(child) })),
					}
				: {
						header: () => props.renderHeader(column),
						default: (scope) => props.renderCell(column, scope),
					}

			return h(ElTableColumn, getElementColumnProps(column), children)
		}
	},
})

const props = defineProps(basicProps)

const emit = defineEmits(['fetch-success', 'fetch-error', 'selection-change', 'register', 'row-click', 'row-dbClick', 'row-contextmenu', 'row-mouseenter', 'row-mouseleave', 'edit-end', 'edit-cancel', 'edit-row-end', 'edit-change', 'expanded-rows-change', 'change', 'columns-change'])

const attrs = useAttrs()
const slots = useSlots()

const tableElRef = ref(null)
const elementHeaderHeightRef = ref(DEFAULT_ELEMENT_TABLE_HEADER_HEIGHT)
const tableData = ref([])

const wrapRef = ref(null)
const formRef = ref(null)
const innerPropsRef = ref()

const { height } = useElementSize(wrapRef)
const { prefixCls } = useDesign('basic-table')
const [registerForm, formActions] = useForm()

const getProps = computed(() => {
	return { ...props, ...unref(innerPropsRef) }
})

const isFixedHeightPage = inject(PageWrapperFixedHeightKey, false)

const { getLoading, setLoading } = useLoading(getProps)
const { getPaginationInfo, getPagination, setPagination, setShowPagination, getShowPagination } = usePagination(getProps)

const { getRowSelection, getRowSelectionRef, getSelectRows, setSelectedRows, clearSelectedRowKeys, getSelectRowKeys, deleteSelectRowByKey, setSelectedRowKeys } = useRowSelection(getProps, tableData, emit)

const {
	handleTableChange: onTableChange,
	getDataSourceRef,
	getDataSource,
	getRawDataSource,
	getSearchInfo,
	setTableData,
	updateTableDataRecord,
	deleteTableDataRecord,
	insertTableDataRecord,
	findTableDataRecord,
	fetch,
	getRowKey,
	reload,
	getAutoCreateKey,
	updateTableData,
} = useDataSource(
	getProps,
	{
		tableData,
		getPaginationInfo,
		setLoading,
		setPagination,
		getFieldsValue: formActions.getFieldsValue,
		clearSelectedRowKeys,
	},
	emit,
)

function handleTableChange(pagination, filters, sorter, extra) {
	onTableChange(pagination, filters, sorter)
	emit('change', pagination, filters, sorter)
	// 解决通过useTable注册onChange时不起作用的问题
	const { onChange } = unref(getProps)
	onChange && isFunction(onChange) && onChange(pagination, filters, sorter, extra)
}

const { getViewColumns, getColumns, setCacheColumnsByField, setCacheColumns, setColumnWidth, setColumns, getColumnsRef, getCacheColumns } = useColumns(getProps, getPaginationInfo)

const { getScrollRef, redoHeight } = useTableScroll(getProps, tableElRef, getColumnsRef, getRowSelectionRef, getDataSourceRef, wrapRef, formRef)

const debounceRedoHeight = debounce(redoHeight, 50)

const { scrollTo } = useTableScrollTo(tableElRef, getDataSourceRef)

const { customRow } = useCustomRow(getProps, {
	setSelectedRowKeys,
	getSelectRowKeys,
	clearSelectedRowKeys,
	getAutoCreateKey,
	emit,
})

const { getRowClassName } = useTableStyle(getProps, prefixCls)

const { getExpandOption, expandAll, expandRows, collapseRows, collapseAll, handleTableExpand } = useTableExpand(getProps, tableData, emit)

const handlers = {
	onColumnsChange: (data) => {
		emit('columns-change', data)
		// support useTable
		unref(getProps).onColumnsChange?.(data)
	},
}

const methods = {
	clearSelectedRowKeys,
	getSelectRowKeys,
}

const { getHeaderProps } = useTableHeader(getProps, slots, handlers, methods)

const { getFooterProps } = useTableFooter(getProps, getScrollRef, tableElRef, getDataSourceRef)

const { getFormProps, replaceFormSlotKey, getFormSlotKeys, handleSearchInfoChange } = useTableForm(getProps, slots, fetch, getLoading)

const getBindValues = computed(() => {
	const dataSource = unref(getDataSourceRef)
	// 这里仍然汇总原 BasicTable 的属性，保证 useTable/register 等上层调用方式不变。
	let propsData = {
		...attrs,
		customRow,
		...unref(getProps),
		...unref(getHeaderProps),
		scroll: unref(getScrollRef),
		loading: unref(getLoading),
		tableLayout: 'fixed',
		rowSelection: unref(getRowSelectionRef),
		rowKey: unref(getRowKey),
		columns: toRaw(unref(getViewColumns)),
		pagination: toRaw(unref(getPaginationInfo)),
		dataSource,
		footer: unref(getFooterProps),
		...unref(getExpandOption),
	}
	// if (slots.expandedRowRender) {
	//   propsData = omit(propsData, 'scroll');
	// }

	propsData = omit(propsData, ['class', 'onChange'])
	return propsData
})

// 以下 getElement* 都是 Element Plus 适配层：上层仍使用原 BasicTable API。
const getHeaderRender = computed(() => unref(getHeaderProps)?.title)

const getElementDataSource = computed(() => unref(getDataSourceRef) || [])

const getElementColumns = computed(() => toRaw(unref(getViewColumns)) || [])

const getElementTreeProps = computed(() => {
	const { childrenColumnName = 'children' } = unref(getProps)
	return { children: childrenColumnName }
})

const getElementExpandedRowKeys = computed(() => unref(getExpandOption)?.expandedRowKeys || [])

const getElementRowKey = computed(() => {
	const rowKey = unref(getRowKey) || ROW_KEY
	return isFunction(rowKey) ? rowKey : rowKey
})

function updateElementHeaderHeight() {
	nextTick(() => {
		const tableEl = unref(tableElRef)?.$el
		const headEl = tableEl?.querySelector('.el-table__header-wrapper')
		const headerHeight = headEl?.offsetHeight
		if (headerHeight) {
			elementHeaderHeightRef.value = headerHeight
		}
	})
}

const getElementTableHeight = computed(() => {
	const tableBodyHeight = unref(getScrollRef)?.y
	if (!tableBodyHeight) return undefined
	const height = Number.parseFloat(tableBodyHeight)
	// Element 表格的 height 是整表高度，需把真实表头高度加回去，body 才能保持原来的固定滚动高度。
	return Number.isFinite(height) ? height + unref(elementHeaderHeightRef) : tableBodyHeight
})

const getElementSelectionFixed = computed(() => {
	const fixed = unref(getRowSelectionRef)?.fixed
	return fixed === true ? 'left' : fixed
})

const getElementPagination = computed(() => {
	const pagination = unref(getPaginationInfo)
	if (isBoolean(pagination)) return null

	// 把原 AntD Pagination 配置转换成 Element Pagination 的 layout 写法。
	const showSizeChanger = pagination.showSizeChanger !== false
	const showQuickJumper = !!pagination.showQuickJumper
	const layout = ['total', showSizeChanger ? 'sizes' : '', 'prev', 'pager', 'next', showQuickJumper ? 'jumper' : ''].filter(Boolean).join(', ')

	return {
		current: pagination.current || pagination.defaultCurrent || 1,
		pageSize: pagination.pageSize || pagination.defaultPageSize || PAGE_SIZE,
		pageSizes: (pagination.pageSizeOptions || []).map((item) => Number(item)).filter((item) => Number.isFinite(item)),
		total: pagination.total || 0,
		layout,
		small: pagination.size === 'small',
		disabled: pagination.disabled,
	}
})

function getElementColumnKey(column) {
	const prop = getElementColumnProp(column)
	return column.key || prop || column.dataIndex || column.title
}

function getElementColumnProp(column) {
	const dataIndex = column.dataIndex
	if (Array.isArray(dataIndex)) return dataIndex.join('.')
	return dataIndex
}

function getElementColumnProps(column) {
	const prop = getElementColumnProp(column)
	const fixed = column.fixed === true ? 'left' : column.fixed
	return {
		// 兼容原 columns 的 dataIndex/fixed/sorter/ellipsis，并映射到 Element Plus 字段。
		prop,
		label: typeof column.title === 'string' ? column.title : '',
		columnKey: column.key || prop,
		width: column.width,
		minWidth: column.minWidth || (!column.width ? 150 : undefined),
		fixed,
		align: column.align || 'center',
		headerAlign: column.align || 'center',
		showOverflowTooltip: !!column.ellipsis,
		sortable: column.sorter ? 'custom' : false,
		className: column.className,
		labelClassName: column.labelClassName,
	}
}

function getElementRowKeyValue(record) {
	const rowKey = unref(getRowKey) || ROW_KEY
	if (isFunction(rowKey)) return rowKey(record)
	return get(record, rowKey)
}

function getElementRows(records = []) {
	const { childrenColumnName = 'children' } = unref(getProps)
	const rows = []
	const walk = (items) => {
		;(items || []).forEach((item) => {
			rows.push(item)
			if (item?.[childrenColumnName]?.length) {
				walk(item[childrenColumnName])
			}
		})
	}
	walk(records)
	return rows
}

function getElementRowIndex(record) {
	return getElementRows(unref(getElementDataSource)).findIndex((item) => getElementRowKeyValue(item) === getElementRowKeyValue(record))
}

function getElementRowClassName({ row, rowIndex }) {
	return getRowClassName(row, rowIndex)
}

function renderElementHeader(column) {
	const slotNodes = slots.headerCell?.({ column })
	if (slotNodes?.length) return slotNodes
	return h(HeaderCell, { column })
}

function renderElementCell(column, scope) {
	const record = scope.row
	const index = scope.$index
	const text = get(record, getElementColumnProp(column))
	const data = { text, value: text, record, index, column }
	const slotName = column.slots?.customRender

	// 保持原来的插槽优先级：列 slots.customRender > bodyCell > column.customRender。
	if (slotName && slots[slotName]) {
		return slots[slotName](data)
	}
	if (slots.bodyCell) {
		return slots.bodyCell(data)
	}
	if (isFunction(column.customRender)) {
		return column.customRender(data)
	}
	return text
}

function createPaginationInfo(info = {}) {
	const pagination = unref(getPaginationInfo)
	if (isBoolean(pagination)) return false
	// Element 的分页事件只给 current/pageSize，这里补回原封装需要的完整 pagination 对象。
	return {
		...pagination,
		current: pagination.current || pagination.defaultCurrent || 1,
		pageSize: pagination.pageSize || pagination.defaultPageSize || PAGE_SIZE,
		...info,
	}
}

function handleElementCurrentChange(current) {
	const pagination = createPaginationInfo({ current })
	if (!pagination || pagination.current === unref(getPaginationInfo)?.current) return
	handleTableChange(pagination, {}, {}, { action: 'paginate' })
}

function handleElementSizeChange(pageSize) {
	const pagination = createPaginationInfo({ current: 1, pageSize })
	if (!pagination) return
	handleTableChange(pagination, {}, {}, { action: 'paginate' })
}

function handleElementSortChange({ column, prop, order }) {
	const pagination = createPaginationInfo()
	const sorter = order
		? {
				column,
				field: prop,
				columnKey: prop,
				order: order === 'ascending' ? 'ascend' : 'descend',
			}
		: {}
	handleTableChange(pagination, {}, sorter, { action: 'sort' })
}

function getElementSelectable(row) {
	const rowSelection = unref(getRowSelectionRef)
	const checkboxProps = rowSelection?.getCheckboxProps?.(row)
	return !checkboxProps?.disabled
}

let syncingSelection = false

async function syncElementSelection() {
	await nextTick()
	const table = unref(tableElRef)
	const rowSelection = unref(getRowSelectionRef)
	if (!table || !rowSelection) return

	// 外部通过 setSelectedRowKeys 改选中项时，同步回 Element 表格内部的选择状态。
	syncingSelection = true
	table.clearSelection?.()
	const selectedKeys = rowSelection.selectedRowKeys || []
	getElementRows(unref(getElementDataSource)).forEach((row) => {
		if (selectedKeys.includes(getElementRowKeyValue(row))) {
			table.toggleRowSelection?.(row, true)
		}
	})
	await nextTick()
	syncingSelection = false
}

function handleElementSelectionChange(selection) {
	if (syncingSelection) return
	const rowSelection = unref(getRowSelectionRef)
	if (!rowSelection) return
	rowSelection.onChange?.(
		selection.map((row) => getElementRowKeyValue(row)),
		selection,
	)
}

function isSelectionEvent(event) {
	// 点到复选框本身时不再触发行点击选中，避免一次点击被切换两次。
	return event
		?.composedPath?.()
		?.some((item) => item?.classList?.contains?.('el-checkbox') || item?.classList?.contains?.('el-table-column--selection'))
}

function handleElementRowClick(record, column, event) {
	const { rowSelection, clickToRowSelect } = unref(getProps)
	const table = unref(tableElRef)
	if (rowSelection && clickToRowSelect && table && !isSelectionEvent(event)) {
		const keyValue = getElementRowKeyValue(record)
		const selectedKeys = getSelectRowKeys() || []
		if (rowSelection.type === 'radio') {
			table.clearSelection?.()
			if (!selectedKeys.includes(keyValue)) {
				table.toggleRowSelection?.(record, true)
			}
		} else {
			table.toggleRowSelection?.(record, !selectedKeys.includes(keyValue))
		}
	}
	emit('row-click', record, getElementRowIndex(record), event)
}

function handleElementRowDbClick(record, column, event) {
	emit('row-dbClick', record, getElementRowIndex(record), event)
}

function handleElementRowContextmenu(record, column, event) {
	emit('row-contextmenu', record, getElementRowIndex(record), event)
}

function handleElementExpandChange(record, expandedRows) {
	const keyValue = getElementRowKeyValue(record)
	const currentKeys = [...unref(getElementExpandedRowKeys)]
	let expanded = false
	let keyValues = currentKeys

	if (Array.isArray(expandedRows)) {
		keyValues = expandedRows.map((row) => getElementRowKeyValue(row))
		expanded = keyValues.includes(keyValue)
	} else {
		expanded = !!expandedRows
		keyValues = expanded ? [...new Set([...currentKeys, keyValue])] : currentKeys.filter((item) => item !== keyValue)
	}

	unref(getExpandOption)?.onExpandedRowsChange?.(keyValues)
	handleTableExpand(expanded, record)
}

const getWrapperClass = computed(() => {
	const values = unref(getBindValues)
	return [
		prefixCls,
		attrs.class,
		{
			[`${prefixCls}-form-container`]: values.useSearchForm,
			[`${prefixCls}--inset`]: values.inset,
		},
	]
})

const getEmptyDataIsShowTable = computed(() => {
	const { emptyDataIsShowTable, useSearchForm } = unref(getProps)
	if (emptyDataIsShowTable || !useSearchForm) {
		return true
	}
	return !!unref(getDataSourceRef).length
})

watch(height, () => {
	unref(isFixedHeightPage) && props.canResize && debounceRedoHeight()
})

onMounted(updateElementHeaderHeight)

watch(
	() => [unref(getScrollRef)?.y, unref(getElementColumns), unref(getElementDataSource)],
	() => {
		updateElementHeaderHeight()
	},
	{ deep: true, flush: 'post' },
)

watch(
	() => [unref(getRowSelectionRef)?.selectedRowKeys, unref(getElementDataSource)],
	() => {
		// 数据刷新或外部 selectedRowKeys 变化后，重新同步 Element 的内部勾选状态。
		syncElementSelection()
	},
	{ deep: true, flush: 'post' },
)

function setProps(props) {
	innerPropsRef.value = { ...unref(innerPropsRef), ...props }
}

const tableAction = {
	reload,
	getSelectRows,
	setSelectedRows,
	clearSelectedRowKeys,
	getSelectRowKeys,
	deleteSelectRowByKey,
	setPagination,
	setTableData,
	updateTableDataRecord,
	deleteTableDataRecord,
	insertTableDataRecord,
	findTableDataRecord,
	redoHeight,
	setSelectedRowKeys,
	setColumns,
	setLoading,
	getDataSource,
	getRawDataSource,
	getSearchInfo,
	setProps,
	getRowSelection,
	getPaginationRef: getPagination,
	getColumns,
	getCacheColumns,
	emit,
	updateTableData,
	setShowPagination,
	getShowPagination,
	setCacheColumnsByField,
	expandAll,
	collapseAll,
	expandRows,
	collapseRows,
	scrollTo,
	getSize: () => {
		return unref(getBindValues).size
	},
	setCacheColumns,
}
createTableContext({ ...tableAction, wrapRef, getBindValues })

emit('register', tableAction, formActions)

defineExpose({ tableElRef, ...tableAction })
</script>

<style lang="less">
@border-color: #cecece4d;

@prefix-cls: ~'@{namespace}-basic-table';

.@{prefix-cls} {
	// 这些变量参考 nn-family-backend 的 Element 全局样式，便于表格/fixed/滚动条统一换肤。
	--nn-bg-elevated: @component-background;
	--nn-surface-muted: #f8f8f9;
	--nn-table-header-bg: #f8f8f9;
	--nn-table-row-hover-bg: #f5f7fa;
	--nn-border: @border-color-base;
	--nn-scrollbar-size: 16px;
	--nn-scrollbar-gutter: 16px;
	--nn-scrollbar-thumb: #c1c1c1;
	--nn-scrollbar-thumb-hover: #a8a8a8;
	--nn-scrollbar-track: #f1f1f1;
	--nn-table-header-height: 55px;
	max-width: 100%;
	height: 100%;

	&-row__striped {
		td {
			background-color: @app-content-background !important;
		}
	}

	&-form-container {
		padding: 16px;

		.ant-form {
			width: 100%;
			margin-bottom: 16px;
			padding: 12px 10px 6px;
			border-radius: 2px;
			background-color: @component-background;
		}
	}

	&__table-wrapper {
		padding: 15px 25px;
    -webkit-box-flex: 1;
    -ms-flex: 1;
    flex: 1;
    background-color: var(--nn-bg-elevated, #ffffff);
    border: 1px solid var(--nn-border, #ebeef5);
    border-radius: 10px;
    box-shadow: 0 8px 24px rgba(15, 23, 42, 0.04);
    overflow: hidden;
	}

	&__header {
		min-height: 40px;
		padding: 0 0 15px;
	}

	&-row__striped {
		td.el-table__cell {
			background-color: var(--nn-surface-muted) !important;
		}
	}

	.el-table {
		// 使用 Element Plus 暴露的 CSS 变量接管表格背景、边框、hover 和 fixed 阴影。
		--el-table-bg-color: var(--nn-bg-elevated);
		--el-table-tr-bg-color: var(--nn-bg-elevated);
		--el-table-expanded-cell-bg-color: var(--nn-bg-elevated);
		--el-table-header-bg-color: var(--nn-table-header-bg);
		--el-table-row-hover-bg-color: var(--nn-table-row-hover-bg);
		--el-table-border-color: var(--nn-border);
		--el-table-border: 1px solid var(--nn-border);
		--el-table-fixed-left-column: inset 10px 0 8px -8px rgb(0 0 0 / 18%);
		--el-table-fixed-right-column: inset -10px 0 8px -8px rgb(0 0 0 / 18%);
		color: @text-color-base;
		background-color: var(--nn-bg-elevated);
	}

	.el-table__header-wrapper th.el-table__cell,
	.el-table__fixed-header-wrapper th.el-table__cell,
	.el-table--scrollable-y th.gutter {
		// 表头高度固定为 55px，和 nn-family-backend 的 $headerCellStyle55 保持一致。
		height: var(--nn-table-header-height) !important;
		padding-top: 0 !important;
		padding-bottom: 0 !important;
		background-color: var(--nn-table-header-bg) !important;
		color: #515a6e;
		font-size: 13px;
		word-break: break-word;
	}

	.el-table__header-wrapper th.el-table__cell > .cell,
	.el-table__fixed-header-wrapper th.el-table__cell > .cell {
		height: var(--nn-table-header-height) !important;
		line-height: var(--nn-table-header-height) !important;
		box-sizing: border-box;
	}

	.el-table th.el-table__cell,
	.el-table td.el-table__cell {
		border-color: var(--nn-border) !important;
	}

	.el-table__body-wrapper,
	.el-table__body-wrapper .el-scrollbar__wrap {
		// 只让表格 body 内部滚动，内容超出时在表格内部出现 X/Y 轴滚动条。
		scrollbar-width: auto;
		scrollbar-color: var(--nn-scrollbar-thumb) var(--nn-scrollbar-track);
	}

	// Windows/Chrome 下使用原生滚动条样式，颜色与 nn-family-backend 保持一致。
	.el-table__body-wrapper .el-scrollbar__wrap::-webkit-scrollbar {
		width: var(--nn-scrollbar-size);
		height: var(--nn-scrollbar-size);
	}

	.el-table__body-wrapper .el-scrollbar__wrap::-webkit-scrollbar-thumb {
		min-width: 40px;
		min-height: 40px;
		border: 3px solid transparent;
		border-radius: 999px;
		background: var(--nn-scrollbar-thumb);
		background-clip: content-box;
		cursor: pointer;
	}

	.el-table__body-wrapper .el-scrollbar__wrap::-webkit-scrollbar-thumb:hover {
		background: var(--nn-scrollbar-thumb-hover);
		background-clip: content-box;
		cursor: pointer;
	}

	.el-table__body-wrapper .el-scrollbar__wrap::-webkit-scrollbar-track {
		border-radius: 999px;
		background: var(--nn-scrollbar-track);
	}

	.el-table .el-scrollbar__bar {
		// Element Plus 还有一层 overlay 滚动条；隐藏它，避免和原生滚动条叠出灰色虚影。
		display: none !important;
	}

	.el-table .el-table-fixed-column--left,
	.el-table .el-table-fixed-column--right,
	.el-table__body-wrapper,
	.el-table__fixed-body-wrapper {
		background-color: var(--nn-bg-elevated) !important;
	}

	.el-table__header-wrapper .el-table-fixed-column--left,
	.el-table__header-wrapper .el-table-fixed-column--right,
	.el-table__fixed-header-wrapper {
		background-color: var(--nn-table-header-bg) !important;
	}

	.el-table__fixed-right-patch,
	.el-table .el-table__cell.gutter {
		// fixed 列与滚动条 gutter 使用同色背景，避免右侧补丁区域出现白块。
		background-color: var(--nn-table-header-bg) !important;
		border-color: var(--nn-border) !important;
	}

	.el-table--scrollable-y .el-table__fixed-right-patch {
		width: var(--nn-scrollbar-gutter) !important;
		height: var(--nn-table-header-height) !important;
	}

	&__pagination {
		// 分页改用 Element Plus，但外观仍贴近原表格底部分页区域。
		display: flex;
		justify-content: flex-end;
		margin: 12px 0 0;
		padding: 2px 10px;
		color: @text-color-secondary;

		.el-pagination__total,
		.el-pagination__jump,
		.el-pagination__sizes {
			color: @text-color-secondary;
		}

		.btn-prev,
		.btn-next,
		.el-pager li {
			min-width: 28px;
			height: 28px;
			border-radius: 2px;
			background-color: var(--nn-bg-elevated);
			line-height: 28px;
		}

		&.is-background {
			.btn-prev,
			.btn-next,
			.el-pager li {
				background-color: var(--nn-bg-elevated);
			}

			.el-pager li.is-active {
				background-color: @primary-color;
				color: @white;
			}
		}

		.el-input__wrapper {
			height: 28px;
			border-radius: 2px;
			background-color: var(--nn-bg-elevated);
			box-shadow: 0 0 0 1px var(--nn-border) inset;
		}
	}

	&--inset {
		.@{prefix-cls}__table-wrapper {
			padding: 0;
		}
	}
}

[data-theme='dark'] {
	.@{prefix-cls} {
		--nn-bg-elevated: @component-background;
		--nn-surface-muted: #101010;
		--nn-table-header-bg: #101010;
		--nn-table-row-hover-bg: #1f1f1f;
		--nn-border: @border-color-base;
		--nn-scrollbar-thumb: #3a3a3a;
		--nn-scrollbar-thumb-hover: #4a4a4a;
		--nn-scrollbar-track: #0f0f0f;

		.el-table {
			color: @text-color-base;
			background-color: var(--nn-bg-elevated);
		}

		.el-table__header-wrapper th.el-table__cell,
		.el-table__fixed-header-wrapper th.el-table__cell {
			color: @text-color-base;
		}

		.el-table__body tr.el-table__row td.el-table__cell {
			background-color: var(--nn-bg-elevated);
			color: @text-color-base;
		}

		.el-table--striped .el-table__body tr.el-table__row--striped td.el-table__cell {
			background-color: var(--nn-surface-muted);
		}

		.el-table--enable-row-hover .el-table__body tr:hover > td.el-table__cell {
			background-color: var(--nn-table-row-hover-bg);
		}

		.el-table-fixed-column--right {
			border-left: 1px solid rgb(255 255 255 / 12%) !important;
		}

		.@{prefix-cls}__pagination {
			.btn-prev,
			.btn-next,
			.el-pager li,
			.el-input__wrapper {
				color: @text-color-base;
				background-color: #12161d !important;
			}
		}
	}
}
</style>
