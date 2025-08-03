export interface Page {
  id: string
  project_id: string
  parent_page_id: string | null
  name: string
  breadcrumb_template: string | null
  sort_order: number
  created_at: string
  updated_at: string
  created_by: string
  last_modified_by: string
  is_deleted: boolean
}

export interface PageWithChildren extends Page {
  children?: PageWithChildren[]
  parameters?: PageParameter[]
}

export interface PageWithDetails extends Page {
  parameters: PageParameter[]
  containers?: ContainerWithChildren[]
}

export interface PageParameter {
  id: string
  page_id: string
  name: string
  data_type: ParameterDataType
  is_required: boolean
  created_at: string
  updated_at: string
  created_by: string
  last_modified_by: string
}

export enum ParameterDataType {
  String = 'string',
  Number = 'number',
  Boolean = 'boolean'
}

export interface Container {
  id: string
  page_id: string
  parent_container_id: string | null
  layout_type: LayoutType
  flex_direction?: FlexDirection | null
  flex_justify?: FlexJustify | null
  flex_align?: FlexAlign | null
  grid_columns?: number | null
  spacing: number
  padding: number
  background_color?: string | null
  width?: string | null
  height?: string | null
  min_height?: string | null
  sort_order: number
  created_at: string
  updated_at: string
  created_by: string
  last_modified_by: string
}

export interface ContainerWithChildren extends Container {
  containers?: ContainerWithChildren[]
  components?: Component[]
}

export enum LayoutType {
  Flex = 'flex',
  Grid = 'grid'
}

export enum FlexDirection {
  Row = 'row',
  Column = 'column'
}

export enum FlexJustify {
  Start = 'start',
  End = 'end',
  Center = 'center',
  SpaceBetween = 'space-between',
  SpaceAround = 'space-around',
  SpaceEvenly = 'space-evenly'
}

export enum FlexAlign {
  Start = 'start',
  End = 'end',
  Center = 'center',
  Stretch = 'stretch'
}

export interface Component {
  id: string
  container_id: string
  component_type: ComponentType
  sort_order: number
  created_at: string
  updated_at: string
  created_by: string
  last_modified_by: string
}

export interface ComponentWithConfig extends Component {
  config: ComponentConfig[]
  form_properties?: FormProperty[]
  table_columns?: TableColumn[]
}

export enum ComponentType {
  Label = 'label',
  Property = 'property',
  Form = 'form',
  List = 'list',
  Table = 'table'
}

export interface ComponentConfig {
  id: string
  component_id: string
  key: string
  value: string
  created_at: string
  updated_at: string
  created_by: string
  last_modified_by: string
}

export interface FormProperty {
  id: string
  component_id: string
  property_id: string
  visible: boolean
  sort_order: number
  created_at: string
  updated_at: string
  created_by: string
  last_modified_by: string
}

export interface TableColumn {
  id: string
  component_id: string
  property_id: string
  visible: boolean
  sort_order: number
  created_at: string
  updated_at: string
  created_by: string
  last_modified_by: string
}

// Input types for mutations
export interface CreatePageInput {
  name: string
  parent_page_id?: string | null
  breadcrumb_template?: string | null
  sort_order?: number
}

export interface UpdatePageInput {
  name?: string
  parent_page_id?: string | null
  breadcrumb_template?: string | null
  sort_order?: number
}

export interface CreatePageParameterInput {
  name: string
  data_type: ParameterDataType
  is_required?: boolean
}

export interface UpdatePageParameterInput {
  name?: string
  data_type?: ParameterDataType
  is_required?: boolean
}

export interface CreateContainerInput {
  page_id: string
  parent_container_id?: string | null
  layout_type: LayoutType
  flex_direction?: FlexDirection | null
  flex_justify?: FlexJustify | null
  flex_align?: FlexAlign | null
  grid_columns?: number | null
  spacing?: number
  padding?: number
  background_color?: string | null
  width?: string | null
  height?: string | null
  min_height?: string | null
  sort_order?: number
}

export interface UpdateContainerInput {
  parent_container_id?: string | null
  layout_type?: LayoutType
  flex_direction?: FlexDirection | null
  flex_justify?: FlexJustify | null
  flex_align?: FlexAlign | null
  grid_columns?: number | null
  spacing?: number
  padding?: number
  background_color?: string | null
  width?: string | null
  height?: string | null
  min_height?: string | null
  sort_order?: number
}

export interface CreateComponentInput {
  container_id: string
  component_type: ComponentType
  sort_order?: number
}

export interface UpdateComponentInput {
  container_id?: string
  sort_order?: number
}

export interface ComponentConfigInput {
  key: string
  value: string
}

export interface FormPropertyInput {
  property_id: string
  visible?: boolean
  sort_order?: number
}

export interface TableColumnInput {
  property_id: string
  visible?: boolean
  sort_order?: number
}