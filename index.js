const Field = require("@saltcorn/data/models/field");
const Table = require("@saltcorn/data/models/table");
const Form = require("@saltcorn/data/models/form");
const View = require("@saltcorn/data/models/view");
const Workflow = require("@saltcorn/data/models/workflow");
const { stateFieldsToWhere } = require("@saltcorn/data/plugin-helper");

const {
    text,
    div,
    h3,
    style,
    a,
    script,
    pre,
    domReady,
    i,
} = require("@saltcorn/markup/tags");
const readState = (state, fields) => {
    fields.forEach((f) => {
        const current = state[f.name];
        if (typeof current !== "undefined") {
            if (f.type.read) state[f.name] = f.type.read(current);
            else if (f.type === "Key")
                state[f.name] = current === "null" ? null : +current;
        }
    });
    return state;
};
const configuration_workflow = () =>
    new Workflow({
        steps: [{
            name: "views",
            form: async(context) => {
                const table = await Table.findOne({ id: context.table_id });
                const fields = await table.getFields();

                const expand_views = await View.find_table_views_where(
                    context.table_id,
                    ({ state_fields, viewtemplate, viewrow }) =>
                    viewrow.name !== context.viewname
                );
                const expand_view_opts = expand_views.map((v) => v.name);

                const create_views = await View.find_table_views_where(
                    context.table_id,
                    ({ state_fields, viewrow }) =>
                    viewrow.name !== context.viewname &&
                    state_fields.every((sf) => !sf.required)
                );
                const create_view_opts = create_views.map((v) => v.name);

                // create new view

                return new Form({
                    fields: [{
                            name: "expand_view",
                            label: "Expand View",
                            type: "String",
                            required: false,
                            attributes: {
                                options: expand_view_opts.join(),
                            },
                        },
                        {
                            name: "view_to_create",
                            label: "Use view to create",
                            sublabel: "Leave blank to have no link to create a new item",
                            type: "String",
                            attributes: {
                                options: create_view_opts.join(),
                            },
                        },
                        /*
                                      {
                                        name: "id_field",
                                        label: "Id field",
                                        type: "String",
                                        sublabel: "Task Id label",
                                        required: true,
                                        attributes: {
                                          options: fields
                                            .filter((f) => f.type.name === "String")
                                            .map((f) => f.name)
                                            .join(),
                                        },
                                      },
                        */
                        {
                            name: "title_field",
                            label: "Title field",
                            type: "String",
                            sublabel: "Task name label",
                            required: true,
                            attributes: {
                                options: fields
                                    .filter((f) => f.type.name === "String")
                                    .map((f) => f.name)
                                    .join(),
                            },
                        },
                        {
                            name: "start_field",
                            label: "Start time field",
                            type: "String",
                            sublabel: "The table needs a fields of type 'Date' to track start times.",
                            required: true,
                            attributes: {
                                options: fields
                                    .filter((f) => f.type.name === "Date")
                                    .map((f) => f.name)
                                    .join(),
                            },
                        },
                        {
                            name: "end_field",
                            label: "End time field",
                            type: "String",
                            sublabel: "The table needs a fields of type 'Date' to track end times.",
                            required: true,
                            attributes: {
                                options: fields
                                    .filter((f) => f.type.name === "Date")
                                    .map((f) => f.name)
                                    .join(),
                            },
                        },
                        {
                            name: "milestone_field",
                            label: "Milestone field",
                            type: "String",
                            sublabel: "The table can supply a fields of type 'Bool' to mark task as milestone.",
                            required: false,
                            attributes: {
                                options: [
                                    ...fields
                                    .filter((f) => f.type.name === "Bool")
                                    .map((f) => f.name),
                                    "Always",
                                ].join(),
                            },
                        },
                        {
                            name: "progress_field",
                            label: "Progress field",
                            type: "String",
                            sublabel: "A fields of type 'Int' or 'Float' to denote progress.",
                            required: false,
                            attributes: {
                                options: fields
                                    .filter(
                                        (f) => f.type.name === "Int" || f.type.name === "Float"
                                    )
                                    .map((f) => f.name)
                                    .join(),
                            },
                        },
                        /*
                                      {
                                        name: "duration_units",
                                        label: "Duration units",
                                        type: "String",
                                        sublabel: "Units of duration field",
                                        required: true,
                                        attributes: {
                                          options: "Seconds,Minutes,Hours,Days",
                                        },
                                      },
                        */
                    ],
                });
            },
        }, ],
    });

const get_state_fields = async(table_id, viewname, { show_view }) => {
    const table_fields = await Field.find({ table_id });
    return table_fields.map((f) => {
        const sf = new Field(f);
        sf.required = false;
        return sf;
    });
};
const run = async(
    table_id,
    viewname, {
        view_to_create,
        expand_view,
        title_field,
        start_field,
        end_field,
        milestone_field,
        progress_field,
        //    allday_field,
        //    duration_field,
        //    duration_units,
    },
    state,
    extraArgs
) => {
    const table = await Table.findOne({ id: table_id });
    const fields = await table.getFields();
    readState(state, fields);
    const qstate = await stateFieldsToWhere({ fields, state });
    const rows = await table.getRows(qstate);
    const id = `cal${Math.round(Math.random() * 100000)}`;

    // defines Tasks List 
    const tasks = rows.map((row) => {
        //const url = expand_view ? `/view/${expand_view}?id=${row.id}` : undefined;
        const custom_class = milestone_field ? 'bar-milestone' : undefined;
        return { title: row[title_field], start: row[start_field], end: row[end_field], progress: row[progress_field], custom_class };
    });
    return div(
        script(
            domReady(`
  var ganttEl = document.getElementById('${id}');
  var gantt = new Gantt(ganttEl, tasks, {

            on_click: function(task) {
                console.log(task);
            },
            on_date_change: function(task, start, end) {
                console.log(task, start, end);
            },
            on_progress_change: function(task, progress) {
                console.log(task, progress);
            },
            on_view_change: function(mode) {
                console.log(mode);
            },
            view_mode: 'Month',
            language: 'en'
        });
        console.log(gantt_chart);
  gantt.render();`)
        ),
        div({ id })
    );
};

const headers = [{
        script: "https://cdnjs.cloudflare.com/ajax/libs/frappe-gantt/0.5.0/frappe-gantt.js",
        integrity: "sha512-IJBi4MhZGy7BV4es5UQQtueQ1q+M7HnWJ4mLnjEQDDh+aFa5jYeqq1mrayUuJrRzMbntc7IaAwESb6jDkTJhww==",
    },
    {
        css: "https://cdnjs.cloudflare.com/ajax/libs/frappe-gantt/0.5.0/frappe-gantt.css",
        integrity: "sha512-qxE5FnEACGZSuLsbaDLCYuMRrxuLhQz1HtOJ2+3dHXSnFlckToa1rXHajkgLciNSdq+FCE4ey8R8fqjrD3HO0g==",
    },
];

module.exports = {
    sc_plugin_api_version: 1,
    headers,
    viewtemplates: [{
        name: "Gantt",
        display_state_form: false,
        get_state_fields,
        configuration_workflow,
        run,
    }, ],
};