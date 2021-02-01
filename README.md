# saltcorn-gantt
Gantt View plugin for Saltcorn.

![Gantt View](https://user-images.githubusercontent.com/327030/106425774-731a8080-6475-11eb-82ae-76a892c16e94.png)

## Description
Shows Gantt view.
Currently implemented only readonly view.

## Author
AlexanderSokolov

## Based on
https://frappe.io/gantt

## View parameters

You need to have following columns in table:

### title field
Name of the task (String).

### start field
Start date of the task (Date).

### end field
End date of the task (Date).

###  milestone field (optional)
(under construction) Mark task as milestone (Bool).

###  progress field (optional)
Task progess (Interger or Float).
The number between 0..100.

## Documentation
* See https://github.com/AleksandrSokolov/saltcorn-gantt/issues/1 for installation manual
