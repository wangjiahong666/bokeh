import * as p from "core/properties"
import {GlyphRenderer} from "models/renderers/glyph_renderer"
import {DrawTool, DrawToolView} from "./draw_tool"

export interface BkEv {
  bokeh: {
    sx: number
    sy: number
  }
  srcEvent: {
    shiftKey?: boolean
  }
  keyCode: number
  timeStamp: number
}

export class VertexEditToolView extends DrawToolView {
  model: VertexEditTool
  _selected_renderer: GlyphRenderer | null
  _timestamp: number

  _doubletap(e: BkEv): void {
    // Perform hit testing
    this._select_event(e, false, this.model.renderers)
    const renderers = this._selected_renderers;

    // If we did not hit an existing line, clear node CDS
    const point_renderer = this.model.point_renderer;
    const point_ds = point_renderer.data_source;
    const point_glyph = point_renderer.glyph;
    const [pxkey, pykey] = Object.getPrototypeOf(point_glyph)._coords[0];
    if (!renderers.length) {
      if (this._timestamp !== e.timeStamp) {
        point_ds.data[pxkey] = [];
        point_ds.data[pykey] = [];
        this._selected_renderer = null;
        point_ds.change.emit(undefined);
      }
      return;
    }
    this._timestamp = e.timeStamp;

    // Otherwise copy selected line array to node CDS
    // (Note: can only edit one at a time)
    const renderer = renderers[0];
    const glyph = renderer.glyph;
    const ds = renderer.data_source;
    const index = ds.selected['1d'].indices[0];
    const [xkey, ykey] = Object.getPrototypeOf(glyph)._coords[0];
    let xs = ds.data[xkey][index];
    let ys = ds.data[ykey][index];

    // Convert typed arrays to regular arrays for editing
    if ((xs.concat == null)) {
      xs = Array.prototype.slice.call(xs);
      ds.data[xkey][index] = xs;
    }
    if ((ys.concat == null)) {
      ys = Array.prototype.slice.call(ys);
      ds.data[ykey][index] = ys;
    }
    point_ds.selected['1d'].indices = [];
    point_ds.data[pxkey] = xs;
    point_ds.data[pykey] = ys;
    point_ds.change.emit(undefined);
    this.model.active = true;
    this._selected_renderer = renderer;
  }

  _tap(e: BkEv): void {
    const renderer = this.model.point_renderer;
    const ds = renderer.data_source;
    const append = e.srcEvent.shiftKey != null ? e.srcEvent.shiftKey : false;
    const indices = ds.selected['1d'].indices.slice(0);
    this._select_event(e, append, [renderer]);
    const point = this._map_drag(e.bokeh.sx, e.bokeh.sy);
    if (ds.selected['1d'].indices.length || point == null) {
      return;
    }

    const [x, y] = point;
    const [xkey, ykey] = Object.getPrototypeOf(renderer.glyph)._coords[0];
    if (indices.length === 1) {
      const index = indices[0]+1;
      ds.selected['1d'].indices = [index];
      ds.data[xkey].splice(index, 0, x);
      ds.data[ykey].splice(index, 0, y);
      ds.change.emit(undefined);
      this._selected_renderer.data_source.properties.data.change.emit(undefined);
    }
  }

  _pan_start(e: BkEv): void {
    this._select_event(e, false, [this.model.point_renderer]);
  }

  _pan(e: BkEv): void {
    const renderer = this.model.point_renderer;
    const ds = renderer.data_source;
    const point = this._map_drag(e.bokeh.sx, e.bokeh.sy);
    if (!ds.selected['1d'].indices.length || point == null || this._selected_renderer == null) {
      return;
    }

    // If a Point is selected drag it
    const [x, y] = point;
    const [xkey, ykey] = Object.getPrototypeOf(renderer.glyph)._coords[0];
    const index = ds.selected['1d'].indices[0];
    ds.data[xkey][index] = x;
    ds.data[ykey][index] = y;
    ds.change.emit(undefined);
    this._selected_renderer.data_source.change.emit(undefined);
  }

  _pan_end(_e: BkEv): void {
    this.model.point_renderer.data_source.selected['1d'].indices = [];
    if (this._selected_renderer) {
      this._selected_renderer.data_source.properties.data.change.emit(undefined);
    }
  }

  _keyup(e: BkEv): void {
    if ((e.keyCode === 8) && this.model.active) {
      this._delete_selected(this.model.point_renderer);
    }
  }
}

export class VertexEditTool extends DrawTool {
  point_renderer: GlyphRenderer

  tool_name = "Vertex Edit Tool"
  icon = "bk-tool-icon-vertex-edit"
  event_type = ["tap", "pan"]
  default_order = 12
}

VertexEditTool.prototype.type = "VertexEditTool"

VertexEditTool.prototype.default_view = VertexEditToolView

VertexEditTool.define({
  point_renderer: [ p.Instance ],
})